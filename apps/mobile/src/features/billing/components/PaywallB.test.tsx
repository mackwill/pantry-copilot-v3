import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { billingStrings } from '../strings';
import { PaywallB } from './PaywallB';

const purchase = vi.fn<(planId: string) => Promise<void>>();
const restore = vi.fn<() => Promise<void>>();
const setAnnual = vi.fn<(annual: boolean) => void>();

vi.mock('../useBilling', () => ({
  useBilling: () => ({
    status: 'idle',
    annual: true,
    selectedPlan: 'pro',
    error: undefined,
    setAnnual,
    selectPlan: vi.fn(),
    purchase,
    restore,
  }),
}));

describe('PaywallB', () => {
  it('renders the ledger headline and comparison rows', () => {
    render(<PaywallB />);
    expect(screen.getByText(billingStrings.compare.headlineLead)).toBeTruthy();
    expect(screen.getByText(billingStrings.compare.rows[0].label)).toBeTruthy();
    expect(screen.getByText(billingStrings.compare.startTrial)).toBeTruthy();
    expect(screen.getByText(billingStrings.compare.chooseBasic)).toBeTruthy();
  });

  it('purchases Pro when the primary CTA is pressed', () => {
    render(<PaywallB />);
    fireEvent.click(screen.getByTestId('paywall-b-pro'));
    expect(purchase).toHaveBeenCalledWith('pro');
  });

  it('purchases Basic when the secondary CTA is pressed', () => {
    render(<PaywallB />);
    fireEvent.click(screen.getByTestId('paywall-b-basic'));
    expect(purchase).toHaveBeenCalledWith('basic');
  });

  it('calls onDismiss when the close control is pressed', () => {
    const onDismiss = vi.fn();
    render(<PaywallB onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId('paywall-close'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
