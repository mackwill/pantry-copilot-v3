import type { AiActionKind, SubscriptionTier, UsageState } from '@pantry/contracts';
import { TRPCError } from '@trpc/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { imageScans, recipes } from '../../db/schema/index.js';
import type { Env } from '../../env.js';
import {
  computeTopUpBalance,
  consumeTopUpCredit,
  readSubscription,
  refreshTopUpCache,
} from './service.js';

/**
 * Per-tier weekly allowances, resolved from env. The board specifies a
 * **weekly** window (reset Sunday 00:00 UTC) for free/basic; pro is an
 * effectively-unlimited high ceiling.
 */
function tierLimitFor(tier: SubscriptionTier, kind: AiActionKind, env: Env): number {
  if (kind === 'recipe') {
    if (tier === 'pro') return env.AI_PRO_RECIPES_PER_WEEK;
    if (tier === 'basic') return env.AI_BASIC_RECIPES_PER_WEEK;
    return env.AI_FREE_RECIPES_PER_WEEK;
  }
  if (tier === 'pro') return env.AI_PRO_SCANS_PER_WEEK;
  if (tier === 'basic') return env.AI_BASIC_SCANS_PER_WEEK;
  return env.AI_FREE_SCANS_PER_WEEK;
}

/** Start of the current week (Sunday 00:00 UTC). */
function startOfWeek(now: Date = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // back to Sunday
  return d;
}

/**
 * Count this user's AI-backed actions of `kind` since the start of the
 * current week. Recipe rows with `source != 'ai'` (manual, imported)
 * don't count — they're not paid actions.
 */
export async function countWeeklyAiUsage(
  db: Db,
  userId: string,
  kind: AiActionKind,
  now: Date = new Date(),
): Promise<number> {
  const since = startOfWeek(now);
  if (kind === 'recipe') {
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(recipes)
      .where(
        and(
          eq(recipes.userId, userId),
          eq(recipes.source, 'ai'),
          gte(recipes.createdAt, since),
        ),
      );
    return row?.n ?? 0;
  }
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(imageScans)
    .where(and(eq(imageScans.userId, userId), gte(imageScans.createdAt, since)));
  return row?.n ?? 0;
}

/**
 * Compute the user's current quota state for a given AI action kind
 * without performing any side-effects. Useful for both the assertion
 * path and the "X recipes left this week" UI.
 */
export async function getAiQuotaState(
  db: Db,
  userId: string,
  kind: AiActionKind,
  env: Env,
  now: Date = new Date(),
): Promise<UsageState> {
  const sub = await readSubscription(db, userId);
  const tierLimit = tierLimitFor(sub.tier, kind, env);
  // Source the balance from the ledger (grants − consumptions) rather
  // than the cached `userSubscriptions.topUpCredits` column: a user can
  // hold top-up grants before any RC subscription row exists, in which
  // case the cache reads 0. Each unit is one extra AI action regardless
  // of `topUpCreditValue` — multiplying would double-count.
  const topUpBonus = await computeTopUpBalance(db, userId);
  const used = await countWeeklyAiUsage(db, userId, kind, now);
  const totalLimit = tierLimit + topUpBonus;
  const remaining = Math.max(totalLimit - used, 0);
  return {
    kind,
    tier: sub.tier,
    used,
    tierLimit,
    topUpBonus,
    totalLimit,
    remaining,
    allowed: used < totalLimit,
  };
}

/**
 * Block the request when the user has exceeded their weekly AI
 * allowance. Throws `FORBIDDEN` with `cause: 'limit_reached'` so
 * clients can detect this case and trigger the paywall (distinct from
 * `pro_required`, which means the action is Pro-only regardless of
 * usage).
 *
 * Side-effect: when the user is over the *tier* limit but still inside
 * the totalLimit thanks to top-up credits, this call records a
 * consumption against the ledger so the next read sees the decremented
 * balance. This is what makes top-ups actually finite.
 */
export async function assertAiActionAllowed(
  db: Db,
  userId: string,
  kind: AiActionKind,
  env: Env,
  now?: Date,
): Promise<UsageState> {
  const state = await getAiQuotaState(db, userId, kind, env, now);
  if (!state.allowed) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'limit_reached',
      cause: 'limit_reached',
    });
  }
  // The user is permitted *and* their tier-only allowance is
  // exhausted — burn one credit. We rely on the ledger's append-only
  // semantics; the cached column is refreshed for fast subsequent
  // reads but is not the source of truth.
  if (state.used >= state.tierLimit && state.topUpBonus > 0) {
    await consumeTopUpCredit(db, { userId, actionKind: kind });
    await refreshTopUpCache(db, userId).catch(() => undefined);
  }
  return state;
}
