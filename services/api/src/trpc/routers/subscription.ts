import type { SubscriptionState as SubscriptionStateDto } from '@pantry/contracts';
import { SubscriptionState, UsageState } from '@pantry/contracts';
import { z } from 'zod';
import { getAiQuotaState } from '../../modules/subscription/limits.js';
import {
  fetchRevenueCatSubscriber,
  type SubscriptionReadModel,
  readSubscription,
  upsertSubscriptionFromSubscriber,
} from '../../modules/subscription/service.js';
import { protectedProcedure, router } from '../init.js';

/** Map the service read model to the wire DTO (Date → ISO string). */
function toStateDto(state: SubscriptionReadModel): SubscriptionStateDto {
  return {
    tier: state.tier,
    isPro: state.isPro,
    subState: state.subState,
    expiresAt: state.expiresAt ? state.expiresAt.toISOString() : null,
    willRenew: state.willRenew,
    productIdentifier: state.productIdentifier,
    periodType: state.periodType,
    store: state.store,
    topUpCredits: state.topUpCredits,
    inGracePeriod: state.inGracePeriod,
  };
}

export const subscriptionRouter = router({
  /**
   * Read the server-authoritative entitlement mirror. Webhooks remain
   * the canonical event stream; this just exposes the stored row.
   */
  get: protectedProcedure
    .output(SubscriptionState)
    .query(async ({ ctx }) => toStateDto(await readSubscription(ctx.db, ctx.session.user.id))),

  /** Per-feature usage view: { recipes, scans } with tier/top-up remaining. */
  usage: protectedProcedure
    .output(z.object({ recipes: UsageState, scans: UsageState }))
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const [recipes, scans] = await Promise.all([
        getAiQuotaState(ctx.db, userId, 'recipe', ctx.env),
        getAiQuotaState(ctx.db, userId, 'scan', ctx.env),
      ]);
      return { recipes, scans };
    }),

  /**
   * On-demand REST pull from RevenueCat after a purchase, to bypass the
   * webhook delay. A safe no-op when the secret key is unset (dev/test):
   * it returns the current cached state without touching the network.
   */
  syncFromRevenueCat: protectedProcedure
    .output(SubscriptionState)
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const appUserId = userId;
      if (ctx.env.REVENUECAT_SECRET_API_KEY) {
        const payload = await fetchRevenueCatSubscriber(appUserId, ctx.env);
        if (payload) await upsertSubscriptionFromSubscriber(ctx.db, appUserId, userId, payload, ctx.env);
      }
      return toStateDto(await readSubscription(ctx.db, userId));
    }),
});
