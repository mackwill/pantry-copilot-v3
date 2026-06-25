import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { billingStrings } from '../strings';
import { PaywallA } from './PaywallA';

const purchase = vi.fn<(planId: string) => Promise<void>>();
const restore = vi.fn<() => Promise<void>>();
const setAnnual = vi.fn<(annual: boolean) => void>();
const selectPlan = vi.fn<(planId: string) => void>();

vi.mock('../useBilling', () => ({
  useBilling: () => ({
    status: 'idle',
    annual: true,
    selectedPlan: 'pro',
    error: undefined,
    setAnnual,
    selectPlan,
    purchase,
    restore,
  }),
}));

describe('PaywallA', () => {
  it('renders the hero copy, feature list, and CTA', () => {
    render(<PaywallA />);
    expect(screen.getByText(billingStrings.paywall.eyebrow)).toBeTruthy();
    expect(screen.getByText(billingStrings.paywall.headlineLead)).toBeTruthy();
    expect(screen.getByText(billingStrings.paywall.features[0])).toBeTruthy();
    expect(screen.getByText(billingStrings.paywall.startTrial)).toBeTruthy();
  });

  it('fires purchase with the selected plan when the CTA is pressed', () => {
    render(<PaywallA />);
    fireEvent.click(screen.getByTestId('paywall-cta'));
    expect(purchase).toHaveBeenCalledWith('pro');
  });

  it('fires restore when the restore control is pressed', () => {
    render(<PaywallA />);
    fireEvent.click(screen.getByTestId('paywall-restore'));
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when the close control is pressed', () => {
    const onDismiss = vi.fn();
    render(<PaywallA onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('paywall-close'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('selects a plan when a plan option is pressed', () => {
    render(<PaywallA />);
    fireEvent.click(screen.getByTestId('plan-option-basic'));
    expect(selectPlan).toHaveBeenCalledWith('basic');
  });
});
