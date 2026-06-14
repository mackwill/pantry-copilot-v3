import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountScreen } from './components/AccountScreen';

const signOut = vi.fn();
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    signOut: (...args: unknown[]) => signOut(...args) as unknown,
  },
}));

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
});
