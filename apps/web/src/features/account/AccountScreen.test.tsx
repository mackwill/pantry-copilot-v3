import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountScreen } from './components/AccountScreen';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

const signOut = vi.fn();
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    signOut: (...args: unknown[]) => signOut(...args) as unknown,
  },
}));

describe('AccountScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOut.mockResolvedValue({ data: {}, error: null });
  });

  it('renders the user name and email', () => {
    render(<AccountScreen user={{ name: 'Mara Singh', email: 'mara@home.kitchen' }} />);
    expect(screen.getAllByText('Mara Singh').length).toBeGreaterThan(0);
    expect(screen.getAllByText('mara@home.kitchen').length).toBeGreaterThan(0);
  });

  it('renders the Account heading', () => {
    render(<AccountScreen user={{ name: 'Mara Singh', email: 'mara@home.kitchen' }} />);
    expect(screen.getByRole('heading', { name: 'Account' })).toBeTruthy();
  });

  it('renders Stats since you joined', () => {
    render(<AccountScreen user={{ name: 'Mara Singh', email: 'mara@home.kitchen' }} />);
    expect(screen.getByText('Stats since you joined')).toBeTruthy();
  });

  it('renders the three stat numbers', () => {
    render(<AccountScreen user={{ name: 'Mara Singh', email: 'mara@home.kitchen' }} />);
    expect(screen.getByText('142')).toBeTruthy();
    expect(screen.getByText('$680')).toBeTruthy();
    expect(screen.getByText('38 lbs')).toBeTruthy();
  });
});
