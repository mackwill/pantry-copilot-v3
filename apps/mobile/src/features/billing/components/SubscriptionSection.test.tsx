import type { SubscriptionState } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { billingStrings } from '../strings';
import { SubscriptionSection } from './SubscriptionSection';

const base: SubscriptionState = {
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

const freeSub: SubscriptionState = base;
const trialSub: SubscriptionState = {
  ...base,
  tier: 'pro',
  isPro: true,
  subState: 'active',
  periodType: 'trial',
  expiresAt: '2026-07-01T00:00:00.000Z',
  willRenew: true,
};
const proSub: SubscriptionState = {
  ...base,
  tier: 'pro',
  isPro: true,
  subState: 'active',
  periodType: 'normal',
  store: 'app_store',
  expiresAt: '2026-07-01T00:00:00.000Z',
  willRenew: true,
};

describe('SubscriptionSection', () => {
  it('renders the free upsell state', () => {
    render(<SubscriptionSection subscription={freeSub} onUpgrade={vi.fn()} onManage={vi.fn()} />);
    expect(screen.getByTestId('subscription-section-free')).toBeTruthy();
    expect(screen.getByText(billingStrings.subscription.freeTitle)).toBeTruthy();
    expect(screen.getByText(billingStrings.subscription.freeCta)).toBeTruthy();
  });

  it('renders the trial state', () => {
    render(<SubscriptionSection subscription={trialSub} onUpgrade={vi.fn()} onManage={vi.fn()} />);
    expect(screen.getByTestId('subscription-section-trial')).toBeTruthy();
    expect(screen.getByText(billingStrings.subscription.trialEyebrow)).toBeTruthy();
    expect(screen.getByText(billingStrings.subscription.trialCta)).toBeTruthy();
  });

  it('renders the pro state', () => {
    render(<SubscriptionSection subscription={proSub} onUpgrade={vi.fn()} onManage={vi.fn()} />);
    expect(screen.getByTestId('subscription-section-pro')).toBeTruthy();
    expect(screen.getByText(billingStrings.subscription.proEyebrow)).toBeTruthy();
    expect(screen.getByText(billingStrings.subscription.proCta)).toBeTruthy();
  });

  it('fires onUpgrade from the free CTA and onManage from the pro CTA', () => {
    const onUpgrade = vi.fn();
    const onManage = vi.fn();
    const { rerender } = render(
      <SubscriptionSection subscription={freeSub} onUpgrade={onUpgrade} onManage={onManage} />,
    );
    fireEvent.click(screen.getByTestId('subscription-section-cta'));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onManage).not.toHaveBeenCalled();

    rerender(<SubscriptionSection subscription={proSub} onUpgrade={onUpgrade} onManage={onManage} />);
    fireEvent.click(screen.getByTestId('subscription-section-cta'));
    expect(onManage).toHaveBeenCalledTimes(1);
  });
});
