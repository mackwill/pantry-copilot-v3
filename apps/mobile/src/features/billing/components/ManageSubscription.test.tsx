import type { SubscriptionState } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { billingStrings } from '../strings';
import { ManageSubscription } from './ManageSubscription';

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

describe('ManageSubscription', () => {
  it('renders the pro hero, billing details, and top-up credits', () => {
    render(
      <ManageSubscription
        subscription={proSub}
        onChangePlan={vi.fn()}
        onCancel={vi.fn()}
        onRestore={vi.fn()}
      />,
    );
    expect(screen.getByText(billingStrings.manage.heroEyebrow)).toBeTruthy();
    expect(screen.getByText(billingStrings.manage.heroTitleEmphasis)).toBeTruthy();
    // willRenew → "Renews" label + formatted UTC date.
    expect(screen.getByText(billingStrings.manage.billingRows.renews)).toBeTruthy();
    expect(screen.getByText('July 3, 2026')).toBeTruthy();
    // Top-up credits surfaced from the fixture.
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('app_store')).toBeTruthy();
  });

  it('fires change-plan, cancel, and restore actions', () => {
    const onChangePlan = vi.fn();
    const onCancel = vi.fn();
    const onRestore = vi.fn();
    render(
      <ManageSubscription
        subscription={proSub}
        onChangePlan={onChangePlan}
        onCancel={onCancel}
        onRestore={onRestore}
      />,
    );
    fireEvent.click(screen.getByTestId('manage-switch-annual'));
    expect(onChangePlan).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('manage-restore'));
    expect(onRestore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('manage-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
