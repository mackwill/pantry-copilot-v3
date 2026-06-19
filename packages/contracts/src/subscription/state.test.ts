import { describe, expect, it } from 'vitest';
import { SubState, SubscriptionState, UsageState, UserUsage } from './state.js';

describe('SubState', () => {
  it('accepts every lifecycle value', () => {
    for (const v of ['none', 'active', 'cancelled', 'expired', 'in_grace_period', 'in_billing_retry', 'paused', 'refunded'])
      expect(SubState.parse(v)).toBe(v);
  });
  it('rejects unknown values', () => {
    expect(() => SubState.parse('lapsed')).toThrow();
  });
});

describe('SubscriptionState', () => {
  it('parses a free default row', () => {
    const parsed = SubscriptionState.parse({
      tier: 'free', isPro: false, subState: 'none', expiresAt: null, willRenew: false,
      productIdentifier: null, periodType: null, store: null, topUpCredits: 0, inGracePeriod: false,
    });
    expect(parsed.tier).toBe('free');
  });
});

describe('UsageState / UserUsage', () => {
  it('parses a per-kind usage view', () => {
    const u: UsageState = { kind: 'recipe', tier: 'free', used: 3, tierLimit: 3, topUpBonus: 0, totalLimit: 3, remaining: 0, allowed: false };
    expect(UsageState.parse(u).remaining).toBe(0);
    expect(UserUsage.parse({ recipes: u, scans: { ...u, kind: 'scan' } }).recipes.kind).toBe('recipe');
  });
});
