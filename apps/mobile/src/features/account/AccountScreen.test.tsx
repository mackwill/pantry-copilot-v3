import type { SubscriptionState } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountScreen } from './components/AccountScreen';

const signOut = vi.fn();
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    signOut: (...args: unknown[]) => signOut(...args) as unknown,
  },
}));

const proSubscription: SubscriptionState = {
  tier: 'pro',
  isPro: true,
  subState: 'active',
  expiresAt: '2026-07-03T00:00:00.000Z',
  willRenew: true,
  productIdentifier: 'pro_monthly',
  periodType: 'normal',
  store: 'app_store',
  topUpCredits: 0,
  inGracePeriod: false,
};

describe('AccountScreen (mobile)', () => {
  const user = { name: 'Mara Singh', email: 'mara@home.kitchen' };

  it('renders real user name and email', () => {
    render(<AccountScreen user={user} />);
    expect(screen.getByText('Mara Singh')).toBeTruthy();
    expect(screen.getByText('mara@home.kitchen')).toBeTruthy();
  });

  it('renders stats eyebrow "Since March"', () => {
    render(<AccountScreen user={user} />);
    expect(screen.getByText('Since March')).toBeTruthy();
  });

  it('renders the three stat numbers', () => {
    render(<AccountScreen user={user} />);
    expect(screen.getByText('142')).toBeTruthy();
    expect(screen.getByText('$680')).toBeTruthy();
    expect(screen.getByText('38 lbs')).toBeTruthy();
  });

  it('renders the three settings section titles', () => {
    render(<AccountScreen user={user} />);
    expect(screen.getByText('Cooking')).toBeTruthy();
    expect(screen.getByText('Household')).toBeTruthy();
    expect(screen.getByText('App')).toBeTruthy();
  });

  it('renders the version string', () => {
    render(<AccountScreen user={user} />);
    expect(screen.getByText('v1.4.0 · build 214')).toBeTruthy();
  });

  it('hides the subscription section when no subscription is provided', () => {
    render(<AccountScreen user={user} />);
    expect(screen.queryByTestId('subscription-section-pro')).toBeNull();
  });

  it('renders the subscription section when subscription is provided', () => {
    render(<AccountScreen user={user} subscription={proSubscription} />);
    expect(screen.getByTestId('subscription-section-pro')).toBeTruthy();
  });
});
