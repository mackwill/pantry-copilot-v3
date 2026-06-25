import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { billingStrings } from '../strings';
import { TrialOffer } from './TrialOffer';

const purchase = vi.fn<(planId: string) => Promise<void>>();

vi.mock('../useBilling', () => ({
  useBilling: () => ({
    status: 'idle',
    annual: true,
    selectedPlan: 'pro',
    error: undefined,
    setAnnual: vi.fn(),
    selectPlan: vi.fn(),
    purchase,
    restore: vi.fn(),
  }),
}));

describe('TrialOffer', () => {
  it('renders the limit eyebrow, offer headline, and quota visualization', () => {
    render(<TrialOffer />);
    expect(screen.getByText(billingStrings.trialOffer.eyebrowLimit)).toBeTruthy();
    expect(screen.getByText(billingStrings.trialOffer.headlineLead)).toBeTruthy();
    expect(screen.getByText(billingStrings.trialOffer.quotaCardHeader)).toBeTruthy();
    expect(screen.getByText(billingStrings.trialOffer.startTrial)).toBeTruthy();
  });

  it('purchases Pro when the trial CTA is pressed', () => {
    render(<TrialOffer />);
    fireEvent.click(screen.getByTestId('trial-offer-cta'));
    expect(purchase).toHaveBeenCalledWith('pro');
  });

  it('calls onSeePlans when the see-plans control is pressed', () => {
    const onSeePlans = vi.fn();
    render(<TrialOffer onSeePlans={onSeePlans} />);
    fireEvent.click(screen.getByTestId('trial-offer-see-plans'));
    expect(onSeePlans).toHaveBeenCalledTimes(1);
  });
});
