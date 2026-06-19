export const SUBSCRIPTION_TIERS = ['free', 'basic', 'pro'] as const;
export const SUB_STATES = [
  'none', 'active', 'cancelled', 'expired',
  'in_grace_period', 'in_billing_retry', 'paused', 'refunded',
] as const;
export const AI_ACTION_KINDS = ['recipe', 'scan'] as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];
export type AiActionKind = (typeof AI_ACTION_KINDS)[number];
