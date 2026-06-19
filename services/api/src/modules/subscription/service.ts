import type { AiActionKind, SubStateValue, SubscriptionTier } from '@pantry/contracts';
import { eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import {
  topUpCreditConsumptions,
  topUpCreditGrants,
  userSubscriptions,
} from '../../db/schema/index.js';
import type { Env } from '../../env.js';
import type { RcSubscriberResponse } from './revenuecat-client.js';

export type { RcSubscriberResponse } from './revenuecat-client.js';
export { fetchRevenueCatSubscriber } from './revenuecat-client.js';

export interface DerivedState {
  tier: SubscriptionTier;
  isPro: boolean;
  productIdentifier: string | null;
  periodType: string | null;
  expiresAt: Date | null;
  willRenew: boolean;
  store: string | null;
  /** Lifecycle state. */
  subState: SubStateValue;
  /** True when access is granted only by the Apple/Google grace period. */
  inGracePeriod: boolean;
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

const FREE_STATE: DerivedState = {
  tier: 'free',
  isPro: false,
  productIdentifier: null,
  periodType: null,
  expiresAt: null,
  willRenew: false,
  store: null,
  subState: 'none',
  inGracePeriod: false,
};

type RcEntitlement = NonNullable<
  RcSubscriberResponse['subscriber']['entitlements']
>[string];

/**
 * Resolve the active tier and its entitlement object. Pro wins over
 * basic when (improbably) both entitlements are present.
 */
function resolveTier(
  sub: RcSubscriberResponse['subscriber'],
  env: Env,
): { tier: 'pro' | 'basic'; entitlement: RcEntitlement } | null {
  const pro = sub.entitlements?.[env.REVENUECAT_PRO_ENTITLEMENT_ID];
  if (pro) return { tier: 'pro', entitlement: pro };
  const basic = sub.entitlements?.[env.REVENUECAT_BASIC_ENTITLEMENT_ID];
  if (basic) return { tier: 'basic', entitlement: basic };
  return null;
}

/**
 * Reduce a RC subscriber payload to the entitlement state we store.
 *
 * The Pro/Basic entitlement is granted by RC when any product attached
 * to that entitlement (in the dashboard) is currently active. We trust
 * RC's truth about the entitlement window — including grace periods
 * past `expires_date` — instead of recomputing solely from timestamps,
 * which previously dropped access the moment a payment retry started.
 */
export function deriveStateFromSubscriber(
  payload: RcSubscriberResponse,
  env: Env,
  now: Date = new Date(),
): DerivedState {
  const sub = payload.subscriber;
  const resolved = resolveTier(sub, env);
  if (!resolved) return FREE_STATE;

  const { tier, entitlement } = resolved;
  const expiresAt = parseDate(entitlement.expires_date);
  const matching = sub.subscriptions?.[entitlement.product_identifier];
  const billingIssuesAt = parseDate(matching?.billing_issues_detected_at ?? null);
  const unsubscribeAt = parseDate(matching?.unsubscribe_detected_at ?? null);
  const refundedAt = parseDate(matching?.refunded_at ?? null);
  const gracePeriodExpiresAt = parseDate(
    entitlement.grace_period_expires_date ??
      matching?.grace_period_expires_date ??
      null,
  );
  const autoResumeAt = parseDate(matching?.auto_resume_date ?? null);

  const isLifetime = !expiresAt;
  const expired = !!expiresAt && expiresAt.getTime() <= now.getTime();
  const inGracePeriod =
    !!gracePeriodExpiresAt && gracePeriodExpiresAt.getTime() > now.getTime();
  // Trust RC's grant: the entitlement object only appears under
  // `entitlements` while RC considers it active. We additionally
  // verify the expiry hasn't lapsed — except inside grace periods.
  const isPro = isLifetime || !expired || inGracePeriod;

  let subState: SubStateValue;
  if (refundedAt) {
    subState = 'refunded';
  } else if (autoResumeAt) {
    subState = 'paused';
  } else if (inGracePeriod) {
    subState = 'in_grace_period';
  } else if (billingIssuesAt && expired) {
    subState = 'in_billing_retry';
  } else if (unsubscribeAt && !expired) {
    subState = 'cancelled';
  } else if (expired && !isLifetime) {
    subState = 'expired';
  } else {
    subState = 'active';
  }

  const willRenew = subState === 'active';

  return {
    tier,
    isPro,
    productIdentifier: entitlement.product_identifier,
    periodType: matching?.period_type ?? 'normal',
    expiresAt,
    willRenew,
    store: matching?.store ?? null,
    subState,
    inGracePeriod,
  };
}

/**
 * Compute the user's current top-up balance from the ledger.
 * `userSubscriptions.topUpCredits` mirrors this for fast reads.
 */
export async function computeTopUpBalance(db: Db, userId: string): Promise<number> {
  const [grants] = await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)::int` })
    .from(topUpCreditGrants)
    .where(eq(topUpCreditGrants.userId, userId));
  const [used] = await db
    .select({ total: sql<number>`coalesce(sum(amount), 0)::int` })
    .from(topUpCreditConsumptions)
    .where(eq(topUpCreditConsumptions.userId, userId));
  return Math.max((grants?.total ?? 0) - (used?.total ?? 0), 0);
}

/**
 * Idempotently grant top-up credits for a non-renewing purchase.
 * `sourceEventId` is the RC webhook event id; the unique index on
 * that column makes duplicate webhooks a no-op without an explicit
 * existence check.
 */
export async function grantTopUpCredit(
  db: Db,
  args: {
    userId: string;
    sourceEventId: string;
    amount: number;
    productIdentifier?: string | null;
  },
): Promise<{ inserted: boolean }> {
  const result = await db
    .insert(topUpCreditGrants)
    .values({
      userId: args.userId,
      sourceEventId: args.sourceEventId,
      amount: args.amount,
      productIdentifier: args.productIdentifier ?? null,
    })
    .onConflictDoNothing({ target: topUpCreditGrants.sourceEventId })
    .returning({ id: topUpCreditGrants.id });
  return { inserted: result.length > 0 };
}

/**
 * Spend one top-up credit for an AI action. Append-only insert to the
 * ledger — callers must have already confirmed the balance is positive
 * via `assertAiActionAllowed`. Note: there is no wrapping transaction,
 * so high-concurrency double-consumption is theoretically possible but
 * accepted at current scale (AI actions are serial per user).
 */
export async function consumeTopUpCredit(
  db: Db,
  args: {
    userId: string;
    actionKind: AiActionKind;
    sourceTable?: string | null;
    sourceId?: string | null;
  },
): Promise<void> {
  await db.insert(topUpCreditConsumptions).values({
    userId: args.userId,
    actionKind: args.actionKind,
    amount: 1,
    sourceTable: args.sourceTable ?? null,
    sourceId: args.sourceId ?? null,
  });
}

/**
 * Upsert the user's entitlement row from a RC subscriber payload.
 * Idempotent — safe to call from both the webhook and the on-demand
 * REST pull.
 */
export async function upsertSubscriptionFromSubscriber(
  db: Db,
  appUserId: string,
  userId: string,
  payload: RcSubscriberResponse,
  env: Env,
  now: Date = new Date(),
): Promise<void> {
  const derived = deriveStateFromSubscriber(payload, env, now);
  const topUpCredits = await computeTopUpBalance(db, userId);
  const values = {
    userId,
    rcAppUserId: appUserId,
    tier: derived.tier,
    isPro: derived.isPro,
    productIdentifier: derived.productIdentifier,
    periodType: derived.periodType,
    expiresAt: derived.expiresAt,
    willRenew: derived.willRenew,
    store: derived.store,
    topUpCredits,
    subState: derived.subState,
    inGracePeriod: derived.inGracePeriod,
    raw: payload as unknown as Record<string, unknown>,
    updatedAt: now,
  };
  await db
    .insert(userSubscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: userSubscriptions.userId,
      set: {
        rcAppUserId: values.rcAppUserId,
        tier: values.tier,
        isPro: values.isPro,
        productIdentifier: values.productIdentifier,
        periodType: values.periodType,
        expiresAt: values.expiresAt,
        willRenew: values.willRenew,
        store: values.store,
        topUpCredits: values.topUpCredits,
        subState: values.subState,
        inGracePeriod: values.inGracePeriod,
        raw: values.raw,
        updatedAt: values.updatedAt,
      },
    });
}

/**
 * Update only the cached `topUpCredits` column from the ledger.
 * Used when consumption happens outside a webhook (i.e. an AI
 * action) so subsequent `subscription.get` reads are fresh.
 */
export async function refreshTopUpCache(db: Db, userId: string): Promise<void> {
  const balance = await computeTopUpBalance(db, userId);
  await db
    .update(userSubscriptions)
    .set({ topUpCredits: balance, updatedAt: new Date() })
    .where(eq(userSubscriptions.userId, userId));
}

export interface SubscriptionReadModel {
  tier: SubscriptionTier;
  isPro: boolean;
  expiresAt: Date | null;
  willRenew: boolean;
  productIdentifier: string | null;
  topUpCredits: number;
  periodType: string | null;
  store: string | null;
  subState: SubStateValue;
  inGracePeriod: boolean;
}

/**
 * Read the current row, returning a stable shape (free / zeros / nulls)
 * when no row exists yet — i.e. the user has never interacted with RC.
 */
export async function readSubscription(
  db: Db,
  userId: string,
): Promise<SubscriptionReadModel> {
  const [row] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);
  if (!row) {
    return {
      tier: 'free',
      isPro: false,
      expiresAt: null,
      willRenew: false,
      productIdentifier: null,
      topUpCredits: 0,
      periodType: null,
      store: null,
      subState: 'none',
      inGracePeriod: false,
    };
  }
  // Active = isPro flag *and* (expiry hasn't passed OR we're in grace).
  // Defence in depth in case a webhook for EXPIRATION was missed.
  const stillActive =
    !row.expiresAt || row.expiresAt.getTime() > Date.now() || row.inGracePeriod;
  const isPro = row.isPro && stillActive;
  return {
    // A lapsed paid tier degrades to free for entitlement purposes.
    tier: isPro ? row.tier : 'free',
    isPro,
    expiresAt: row.expiresAt,
    willRenew: row.willRenew,
    productIdentifier: row.productIdentifier,
    topUpCredits: row.topUpCredits,
    periodType: row.periodType,
    store: row.store,
    subState: row.subState,
    inGracePeriod: row.inGracePeriod,
  };
}
