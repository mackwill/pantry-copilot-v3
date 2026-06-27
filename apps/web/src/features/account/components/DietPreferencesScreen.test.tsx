import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DietPreferencesScreen } from './DietPreferencesScreen';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const updatePrefs = vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue({ diet: [], allergies: [] });
vi.mock('../../../lib/api', () => ({
  api: { user: { updatePreferences: { mutate: (input: unknown): Promise<unknown> => updatePrefs(input) } } },
}));

vi.mock('../../../lib/auth-client', () => ({
  authClient: { signOut: () => Promise.resolve({ data: {}, error: null }) },
}));

describe('DietPreferencesScreen', () => {
  const user = { name: 'Mara', email: 'mara@home.kitchen' };

  it('saves the edited diet + allergy selection via the user router', () => {
    render(<DietPreferencesScreen user={user} preferences={{ diet: [], allergies: [] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Keto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Peanuts' }));
    fireEvent.click(screen.getByRole('button', { name: /Save preferences/ }));
    expect(updatePrefs).toHaveBeenCalledWith({ diet: ['keto'], allergies: ['peanuts'] });
  });

  it('pre-selects preferences passed from the loader', () => {
    render(<DietPreferencesScreen user={user} preferences={{ diet: ['vegan'], allergies: [] }} />);
    expect(screen.getByRole('button', { name: 'Vegan' }).getAttribute('aria-pressed')).toBe('true');
  });
});
