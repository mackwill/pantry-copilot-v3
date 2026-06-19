import { z } from 'zod';
import { AI_ACTION_KINDS, SUB_STATES, SUBSCRIPTION_TIERS } from './enums';

export const SubscriptionTierSchema = z.enum(SUBSCRIPTION_TIERS);
export const SubState = z.enum(SUB_STATES);
export type SubStateValue = z.infer<typeof SubState>;

/** Server-authoritative entitlement mirror, exposed to clients. */
export const SubscriptionState = z.object({
  tier: SubscriptionTierSchema,
  /** Convenience flag: the user has any paid, active entitlement. */
  isPro: z.boolean(),
  subState: SubState,
  expiresAt: z.iso.datetime().nullable(),
  willRenew: z.boolean(),
  productIdentifier: z.string().nullable(),
  periodType: z.string().nullable(),
  store: z.string().nullable(),
  topUpCredits: z.number().int().nonnegative(),
  inGracePeriod: z.boolean(),
});
export type SubscriptionState = z.infer<typeof SubscriptionState>;

export const UsageState = z.object({
  kind: z.enum(AI_ACTION_KINDS),
  tier: SubscriptionTierSchema,
  used: z.number().int().nonnegative(),
  tierLimit: z.number().int().nonnegative(),
  topUpBonus: z.number().int().nonnegative(),
  totalLimit: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  allowed: z.boolean(),
});
export type UsageState = z.infer<typeof UsageState>;

export const UserUsage = z.object({ recipes: UsageState, scans: UsageState });
export type UserUsage = z.infer<typeof UserUsage>;
