import { eq, inArray } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Db } from '../../db/client.js';
import {
  revenuecatWebhookEvents,
  users,
  userSubscriptions,
} from '../../db/schema/index.js';
import type { AppDeps } from '../../server.js';
import {
  fetchRevenueCatSubscriber,
  grantTopUpCredit,
  refreshTopUpCache,
  upsertSubscriptionFromSubscriber,
} from './service.js';

/**
 * RevenueCat webhook event shape (the subset we care about).
 *
 * Docs: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
 *
 * `app_user_id` matches `Purchases.logIn(userId)` on the client, which
 * we always set to the Better Auth user id. Events we handle:
 *   INITIAL_PURCHASE | RENEWAL | CANCELLATION | EXPIRATION |
 *   PRODUCT_CHANGE | UNCANCELLATION | NON_RENEWING_PURCHASE |
 *   BILLING_ISSUE | SUBSCRIPTION_PAUSED | SUBSCRIBER_ALIAS | TRANSFER
 */
const RcWebhookEventSchema = z.object({
  event: z.object({
    // RC includes a UUID per delivered event. We dedupe on it.
    id: z.string().min(1),
    type: z.string().min(1),
    app_user_id: z.string().min(1),
    original_app_user_id: z.string().optional().nullable(),
    aliases: z.array(z.string()).optional(),
    product_id: z.string().optional().nullable(),
    expiration_at_ms: z.number().nullable().optional(),
    purchased_at_ms: z.number().optional(),
    period_type: z.string().optional().nullable(),
    store: z.string().optional().nullable(),
    transferred_from: z.array(z.string()).optional(),
    transferred_to: z.array(z.string()).optional(),
  }),
  api_version: z.string().optional(),
});

type RcWebhookEvent = z.infer<typeof RcWebhookEventSchema>;

const HANDLED_EVENT_TYPES = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'UNCANCELLATION',
  'EXPIRATION',
  'PRODUCT_CHANGE',
  'BILLING_ISSUE',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_PAUSED',
  'SUBSCRIBER_ALIAS',
  'TRANSFER',
  'TEST',
]);

/**
 * Resolve the local user id from any of the candidate RC ids
 * (current `app_user_id`, RC's `original_app_user_id`, plus any
 * `aliases` / `transferred_from` lists). Returns the first match.
 */
async function resolveLocalUser(
  db: Db,
  candidates: readonly string[],
): Promise<string | null> {
  const filtered = candidates.filter((c) => !!c && !c.startsWith('$RCAnonymousID:'));
  if (filtered.length === 0) return null;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.id, filtered));
  return rows[0]?.id ?? null;
}

/**
 * Migrate ledger / subscription rows that were keyed against an
 * old anonymous (or merged) RC id over to the now-known user id.
 * Triggered by SUBSCRIBER_ALIAS / TRANSFER events.
 */
async function migrateAliasedData(
  db: Db,
  newUserId: string,
  oldIds: readonly string[],
): Promise<void> {
  const candidates = oldIds.filter(
    (v) => !!v && v !== newUserId && !v.startsWith('$RCAnonymousID:'),
  );
  if (candidates.length === 0) return;
  // Move grants/consumptions from any prior local user_id (if the
  // old rc id happens to match a real user row that's being merged).
  // We deliberately only key by user_id here — anonymous purchases
  // never had a local row, so there's nothing to migrate.
  for (const oldId of candidates) {
    await db
      .update(userSubscriptions)
      .set({ rcAppUserId: newUserId })
      .where(eq(userSubscriptions.userId, oldId));
  }
}

/**
 * Register POST /webhooks/revenuecat. Mounted outside the tRPC plugin
 * so it can accept arbitrary JSON without superjson framing.
 *
 * Trust boundary:
 *   1. Validate Authorization header against the configured shared
 *      secret (set in the RC dashboard).
 *   2. Parse the body with Zod; reject malformed bodies with 400.
 *   3. Dedupe on `event.id` using `revenuecat_webhook_events` so
 *      RC's at-least-once retries can't double-apply a grant.
 *
 * On every accepted event we re-pull the full subscriber record via
 * the REST API and upsert the derived state. This is more robust than
 * building state from the event payload incrementally — RC's
 * subscriber endpoint always reflects the current truth, so we can't
 * end up with stale rows after out-of-order delivery. In dev (no
 * secret key) we fall back to writing a minimal row from the event.
 */
export function registerRevenueCatWebhook(
  app: FastifyInstance,
  deps: AppDeps,
): void {
  const { db, env } = deps;
  app.post(
    '/webhooks/revenuecat',
    {
      // Webhooks have their own retry/backoff; exempt from global rate
      // limit so a burst of legitimate events isn't dropped.
      config: { rateLimit: false },
    },
    async (request, reply) => {
      const authz = request.headers['authorization'];
      const expected = env.REVENUECAT_WEBHOOK_AUTH;
      if (!expected) {
        request.log.warn('revenuecat_webhook_disabled');
        return reply.code(503).send({ error: 'webhook_not_configured' });
      }
      if (typeof authz !== 'string' || authz !== expected) {
        return reply.code(401).send({ error: 'unauthorized' });
      }

      const parsed = RcWebhookEventSchema.safeParse(request.body);
      if (!parsed.success) {
        request.log.warn(
          { issues: parsed.error.issues },
          'revenuecat_webhook_invalid_payload',
        );
        return reply.code(400).send({ error: 'invalid_payload' });
      }
      const body: RcWebhookEvent = parsed.data;

      const { id: eventId, type, app_user_id, original_app_user_id } = body.event;

      if (!HANDLED_EVENT_TYPES.has(type)) {
        // Ack unknown event types (forward-compatible) but no-op.
        request.log.info({ type, eventId }, 'revenuecat_webhook_unhandled_type');
        return reply.code(200).send({ ok: true, ignored: true });
      }

      // Idempotency check — RC retries up to 3× and may double-deliver.
      // We insert (eventId, type, app_user_id) up front; conflict =
      // already processed, so we can ack and skip.
      const inserted = await db
        .insert(revenuecatWebhookEvents)
        .values({ eventId, type, appUserId: app_user_id })
        .onConflictDoNothing({ target: revenuecatWebhookEvents.eventId })
        .returning({ eventId: revenuecatWebhookEvents.eventId });
      if (inserted.length === 0) {
        request.log.info({ eventId, type }, 'revenuecat_webhook_duplicate');
        return reply.code(200).send({ ok: true, duplicate: true });
      }

      const candidateIds = [
        app_user_id,
        original_app_user_id ?? null,
        ...(body.event.aliases ?? []),
        ...(body.event.transferred_from ?? []),
        ...(body.event.transferred_to ?? []),
      ].filter((v): v is string => typeof v === 'string' && v.length > 0);

      const userId = await resolveLocalUser(db, candidateIds);
      if (!userId) {
        // RC may emit events for anonymous ($RCAnonymousID:…) users
        // that haven't been aliased yet. Ack and move on; the next
        // event after `logIn` will arrive with the real id.
        request.log.info({ app_user_id, eventId }, 'revenuecat_webhook_unknown_user');
        return reply.code(200).send({ ok: true, ignored: true });
      }

      // Alias / Transfer events may bring in purchases keyed against
      // a previous id. Re-key our row before re-pulling.
      if (type === 'SUBSCRIBER_ALIAS' || type === 'TRANSFER') {
        await migrateAliasedData(
          db,
          userId,
          candidateIds.filter((c) => c !== userId),
        );
      }

      // Top-up grant — single source of truth for credit balances.
      // Idempotent on event.id, so the dedupe above + this together
      // are belt-and-braces against double-grants.
      if (type === 'NON_RENEWING_PURCHASE') {
        await grantTopUpCredit(db, {
          userId,
          sourceEventId: eventId,
          amount: env.AI_TOP_UP_CREDIT_VALUE,
          productIdentifier: body.event.product_id ?? null,
        });
      }

      const payload = await fetchRevenueCatSubscriber(userId, env);
      if (!payload) {
        // No secret key in dev → write a minimal row from the event
        // alone so QA can see entitlement flips without REST credentials.
        const isActive =
          type === 'INITIAL_PURCHASE' ||
          type === 'RENEWAL' ||
          type === 'UNCANCELLATION' ||
          type === 'PRODUCT_CHANGE';
        const productId = body.event.product_id ?? null;
        const tier: 'free' | 'basic' | 'pro' = isActive
          ? productId?.toLowerCase().includes('basic')
            ? 'basic'
            : 'pro'
          : 'free';
        const isPro = tier !== 'free';
        const productIdentifier = body.event.product_id ?? null;
        const periodType = body.event.period_type ?? null;
        const expiresAt = body.event.expiration_at_ms
          ? new Date(body.event.expiration_at_ms)
          : null;
        const store = body.event.store ?? null;
        const subState =
          type === 'BILLING_ISSUE'
            ? 'in_billing_retry'
            : type === 'SUBSCRIPTION_PAUSED'
              ? 'paused'
              : type === 'CANCELLATION'
                ? 'cancelled'
                : type === 'EXPIRATION'
                  ? 'expired'
                  : 'active';
        const raw = body as unknown as Record<string, unknown>;
        const now = new Date();
        await db
          .insert(userSubscriptions)
          .values({
            userId,
            rcAppUserId: userId,
            tier,
            isPro,
            productIdentifier,
            periodType,
            expiresAt,
            store,
            subState,
            raw,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: userSubscriptions.userId,
            // A returning user may re-purchase, so update the full
            // entitlement set — not just raw (which is all v2 did).
            set: {
              tier,
              isPro,
              subState,
              productIdentifier,
              periodType,
              expiresAt,
              store,
              raw,
              updatedAt: now,
            },
          });
        // Refresh the cached top-up balance even in event-only mode so
        // the NON_RENEWING_PURCHASE path above is reflected immediately.
        await refreshTopUpCache(db, userId).catch(() => undefined);
        return reply.code(200).send({ ok: true, mode: 'event_only' });
      }

      await upsertSubscriptionFromSubscriber(db, userId, userId, payload, env);
      return reply.code(200).send({ ok: true });
    },
  );
}
