import { describe, expect, it } from 'vitest';
import { deriveStateFromSubscriber } from './service.js';
import { readEnv } from '../../env.js';

const env = readEnv({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://x',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  REVENUECAT_PRO_ENTITLEMENT_ID: 'pro',
  REVENUECAT_BASIC_ENTITLEMENT_ID: 'basic',
});
const now = new Date('2026-06-17T00:00:00Z');

describe('deriveStateFromSubscriber', () => {
  it('derives pro/active from a live pro entitlement', () => {
    const s = deriveStateFromSubscriber(
      {
        subscriber: {
          entitlements: {
            pro: {
              expires_date: '2026-07-17T00:00:00Z',
              product_identifier: 'pro_monthly',
              purchase_date: '2026-06-17T00:00:00Z',
            },
          },
          subscriptions: {
            pro_monthly: {
              expires_date: '2026-07-17T00:00:00Z',
              period_type: 'normal',
              store: 'app_store',
            },
          },
        },
      },
      env,
      now,
    );
    expect(s.tier).toBe('pro');
    expect(s.isPro).toBe(true);
    expect(s.subState).toBe('active');
  });

  it('derives free when there is no entitlement', () => {
    const s = deriveStateFromSubscriber({ subscriber: {} }, env, now);
    expect(s.tier).toBe('free');
    expect(s.isPro).toBe(false);
    expect(s.subState).toBe('none');
  });

  it('derives basic tier from the basic entitlement', () => {
    const s = deriveStateFromSubscriber(
      {
        subscriber: {
          entitlements: {
            basic: {
              expires_date: '2026-07-17T00:00:00Z',
              product_identifier: 'basic_monthly',
              purchase_date: '2026-06-17T00:00:00Z',
            },
          },
          subscriptions: {
            basic_monthly: { expires_date: '2026-07-17T00:00:00Z', period_type: 'normal' },
          },
        },
      },
      env,
      now,
    );
    expect(s.tier).toBe('basic');
    expect(s.isPro).toBe(true);
  });

  it('marks a lapsed pro entitlement expired and drops access', () => {
    const s = deriveStateFromSubscriber(
      {
        subscriber: {
          entitlements: {
            pro: {
              expires_date: '2026-06-01T00:00:00Z',
              product_identifier: 'pro_monthly',
              purchase_date: '2026-05-01T00:00:00Z',
            },
          },
          subscriptions: {
            pro_monthly: { expires_date: '2026-06-01T00:00:00Z', period_type: 'normal' },
          },
        },
      },
      env,
      now,
    );
    expect(s.subState).toBe('expired');
    expect(s.isPro).toBe(false);
    expect(s.willRenew).toBe(false);
  });

  it('keeps access for a cancelled-but-not-yet-expired entitlement, not renewing', () => {
    const s = deriveStateFromSubscriber(
      {
        subscriber: {
          entitlements: {
            pro: {
              expires_date: '2026-07-17T00:00:00Z',
              product_identifier: 'pro_monthly',
              purchase_date: '2026-06-17T00:00:00Z',
            },
          },
          subscriptions: {
            pro_monthly: {
              expires_date: '2026-07-17T00:00:00Z',
              period_type: 'normal',
              unsubscribe_detected_at: '2026-06-15T00:00:00Z',
            },
          },
        },
      },
      env,
      now,
    );
    expect(s.subState).toBe('cancelled');
    expect(s.isPro).toBe(true);
    expect(s.willRenew).toBe(false);
  });

  it('keeps access during a billing-retry grace period', () => {
    const s = deriveStateFromSubscriber(
      {
        subscriber: {
          entitlements: {
            pro: {
              expires_date: '2026-06-10T00:00:00Z',
              grace_period_expires_date: '2026-06-25T00:00:00Z',
              product_identifier: 'pro_monthly',
              purchase_date: '2026-05-10T00:00:00Z',
            },
          },
          subscriptions: {
            pro_monthly: {
              expires_date: '2026-06-10T00:00:00Z',
              period_type: 'normal',
              billing_issues_detected_at: '2026-06-10T00:00:00Z',
            },
          },
        },
      },
      env,
      now,
    );
    expect(s.subState).toBe('in_grace_period');
    expect(s.inGracePeriod).toBe(true);
    expect(s.isPro).toBe(true);
  });
});
