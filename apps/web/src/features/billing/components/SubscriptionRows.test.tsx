import type { SubscriptionState } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { billingStrings as s } from '../strings';
import { SubscriptionRows } from './SubscriptionRows';

const proSub: SubscriptionState = {
  tier: 'pro',
  isPro: true,
  subState: 'active',
  expiresAt: '2026-07-03T00:00:00.000Z',
  willRenew: true,
  productIdentifier: 'pro_monthly',
  periodType: 'normal',
  store: 'app_store',
  topUpCredits: 5,
  inGracePeriod: false,
};

const freeSub: SubscriptionState = {
  tier: 'free',
  isPro: false,
  subState: 'none',
  expiresAt: null,
  willRenew: false,
  productIdentifier: null,
  periodType: null,
  store: null,
  topUpCredits: 0,
  inGracePeriod: false,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('SubscriptionRows', () => {
  it('renders the Pro hero, billing details and change-plan card from a Pro state', () => {
    render(<SubscriptionRows subscription={proSub} onManage={vi.fn()} />);
    expect(screen.getByText(s.subscription.proEyebrow)).toBeTruthy();
    expect(screen.getAllByText(s.subscription.proTitle).length).toBeGreaterThan(0);
    expect(screen.getByText(s.subscription.billingTitle)).toBeTruthy();
    expect(screen.getByText(s.subscription.changeTitle)).toBeTruthy();
    // expiresAt formatted + renews label (willRenew = true) + top-up credits
    expect(screen.getByText('July 3, 2026')).toBeTruthy();
    expect(screen.getByText(s.subscription.billingRows.renews)).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('renders the Free upsell state without billing detail cards', () => {
    render(<SubscriptionRows subscription={freeSub} onManage={vi.fn()} />);
    expect(screen.getByText(s.subscription.freeEyebrow)).toBeTruthy();
    expect(screen.getByText(s.subscription.freeTitle)).toBeTruthy();
    expect(screen.getByText(s.subscription.freeCta)).toBeTruthy();
    expect(screen.queryByText(s.subscription.billingTitle)).toBeNull();
  });

  it('fires onManage from the Pro Manage CTA', async () => {
    const onManage = vi.fn();
    render(<SubscriptionRows subscription={proSub} onManage={onManage} />);
    await userEvent.click(screen.getByRole('button', { name: s.subscription.proManage }));
    expect(onManage).toHaveBeenCalledTimes(1);
  });

  it('fires onManage from the Free trial CTA', async () => {
    const onManage = vi.fn();
    render(<SubscriptionRows subscription={freeSub} onManage={onManage} />);
    await userEvent.click(screen.getByRole('button', { name: s.subscription.freeCta }));
    expect(onManage).toHaveBeenCalledTimes(1);
  });
});
