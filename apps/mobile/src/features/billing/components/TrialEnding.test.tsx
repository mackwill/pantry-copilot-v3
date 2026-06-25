import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { billingStrings } from '../strings';
import { TrialEnding } from './TrialEnding';

const purchase = vi.fn<(planId: string) => Promise<void>>();
const setAnnual = vi.fn<(annual: boolean) => void>();

vi.mock('../useBilling', () => ({
  useBilling: () => ({
    status: 'idle',
    annual: false,
    selectedPlan: 'pro',
    error: undefined,
    setAnnual,
    selectPlan: vi.fn(),
    purchase,
    restore: vi.fn(),
  }),
}));

describe('TrialEnding', () => {
  it('renders the countdown, usage recap, and keep/cancel CTAs', () => {
    render(<TrialEnding />);
    expect(screen.getByText(billingStrings.trialEnding.badge)).toBeTruthy();
    expect(screen.getByText(billingStrings.trialEnding.perks[0].label)).toBeTruthy();
    expect(screen.getByText(billingStrings.trialEnding.keepPro)).toBeTruthy();
    expect(screen.getByText(billingStrings.trialEnding.cancel)).toBeTruthy();
  });

  it('keeps Pro (purchases) when the primary CTA is pressed', () => {
    render(<TrialEnding />);
    fireEvent.click(screen.getByTestId('trial-ending-keep'));
    expect(purchase).toHaveBeenCalledWith('pro');
  });

  it('switches to annual then purchases when the annual CTA is pressed', () => {
    render(<TrialEnding />);
    fireEvent.click(screen.getByTestId('trial-ending-annual'));
    expect(setAnnual).toHaveBeenCalledWith(true);
    expect(purchase).toHaveBeenCalledWith('pro');
  });

  it('calls onCancel and onBack', () => {
    const onCancel = vi.fn();
    const onBack = vi.fn();
    render(<TrialEnding onCancel={onCancel} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('trial-ending-cancel'));
    fireEvent.click(screen.getByTestId('trial-ending-back'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
