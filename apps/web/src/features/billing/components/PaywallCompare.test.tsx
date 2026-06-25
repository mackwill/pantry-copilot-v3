import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { billingStrings as s } from '../strings';
import type { UseBillingResult } from '../useBilling';
import { PaywallCompare } from './PaywallCompare';

const purchase = vi.fn<UseBillingResult['purchase']>(() => Promise.resolve());

vi.mock('../useBilling', () => ({
  useBilling: (): UseBillingResult => ({
    status: 'idle',
    annual: true,
    selectedPlan: 'pro',
    error: undefined,
    setAnnual: vi.fn(),
    selectPlan: vi.fn(),
    purchase,
    restore: vi.fn(() => Promise.resolve()),
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('PaywallCompare', () => {
  it('renders the compare headline and table feature rows', () => {
    render(<PaywallCompare />);
    expect(screen.getByText(s.compare.headlineLead)).toBeTruthy();
    for (const row of s.compare.rows) {
      expect(screen.getByText(row.label)).toBeTruthy();
    }
  });

  it('renders all three plan column headers', () => {
    render(<PaywallCompare />);
    for (const col of s.compare.columns) {
      expect(screen.getByText(col.name)).toBeTruthy();
    }
  });

  it('fires purchase with pro when the primary CTA is clicked', async () => {
    render(<PaywallCompare />);
    await userEvent.click(screen.getByRole('button', { name: s.compare.columns[2].cta }));
    expect(purchase).toHaveBeenCalledWith('pro');
  });

  it('fires purchase with basic when the Basic CTA is clicked', async () => {
    render(<PaywallCompare />);
    await userEvent.click(screen.getByRole('button', { name: s.compare.columns[1].cta }));
    expect(purchase).toHaveBeenCalledWith('basic');
  });

  it('invokes onDismiss for the Free column CTA', async () => {
    const onDismiss = vi.fn();
    render(<PaywallCompare onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: s.compare.columns[0].cta }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(purchase).not.toHaveBeenCalled();
  });
});
