import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { billingStrings as s } from '../strings';
import type { UseBillingResult } from '../useBilling';
import { PaywallEditorial } from './PaywallEditorial';

const purchase = vi.fn<UseBillingResult['purchase']>(() => Promise.resolve());
const restore = vi.fn<UseBillingResult['restore']>(() => Promise.resolve());
const setAnnual = vi.fn();

vi.mock('../useBilling', () => ({
  useBilling: (): UseBillingResult => ({
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

afterEach(() => {
  vi.clearAllMocks();
});

describe('PaywallEditorial', () => {
  it('renders the editorial headline, body and reassurance copy', () => {
    render(<PaywallEditorial />);
    expect(screen.getByText(s.paywall.headlineLead)).toBeTruthy();
    expect(screen.getByText(s.paywall.headlineEmphasis)).toBeTruthy();
    expect(screen.getByText(s.paywall.body)).toBeTruthy();
    expect(screen.getByText(s.paywall.reassurance)).toBeTruthy();
  });

  it('renders both plan CTAs', () => {
    render(<PaywallEditorial />);
    expect(screen.getByRole('button', { name: s.planCard.cta.basic })).toBeTruthy();
    expect(screen.getByRole('button', { name: s.planCard.cta.pro })).toBeTruthy();
  });

  it('fires purchase with the chosen plan id', async () => {
    render(<PaywallEditorial />);
    await userEvent.click(screen.getByRole('button', { name: s.planCard.cta.pro }));
    expect(purchase).toHaveBeenCalledWith('pro');
  });

  it('restores purchases when the restore link is clicked', async () => {
    render(<PaywallEditorial />);
    await userEvent.click(screen.getByRole('button', { name: s.paywall.restoreCta }));
    expect(restore).toHaveBeenCalledTimes(1);
  });

  it('invokes onCompare when the compare link is clicked', async () => {
    const onCompare = vi.fn();
    render(<PaywallEditorial onCompare={onCompare} />);
    await userEvent.click(screen.getByRole('button', { name: s.paywall.compareCta }));
    expect(onCompare).toHaveBeenCalledTimes(1);
  });

  it('invokes onDismiss when "Maybe later" is clicked', async () => {
    const onDismiss = vi.fn();
    render(<PaywallEditorial onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: s.paywall.maybeLater }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
