import type { PantryItem } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';
import { generationStrings } from '../strings';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const today = new Date();
function isoIn(days: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeItem(overrides: Partial<PantryItem>): PantryItem {
  return {
    id: crypto.randomUUID(),
    name: 'Item',
    brand: null,
    quantity: 1,
    unit: 'ea',
    category: 'pantry',
    location: 'pantry_upper',
    purchasedAt: null,
    bestBy: null,
    notes: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

const items: PantryItem[] = [
  makeItem({ name: 'Whole milk', category: 'dairy', quantity: 1, unit: 'gallon', bestBy: isoIn(2) }),
  makeItem({ name: 'Scallions', category: 'produce', quantity: 1, unit: 'bunch', bestBy: isoIn(3) }),
  makeItem({ name: 'Soba noodles', category: 'pantry', bestBy: isoIn(180) }),
];

const user = { name: 'Mara Quinn', email: 'mara@example.com' };
const s = generationStrings.home;

describe('HomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the greeting, hero prompt and expiring context', () => {
    render(<HomeScreen user={user} items={items} />);
    expect(screen.getByText(s.greetingAccent)).toBeTruthy();
    expect(screen.getByText(/Hi Mara\./)).toBeTruthy();
    expect(screen.getByText('Whole milk')).toBeTruthy();
    expect(screen.getByText('Scallions')).toBeTruthy();
    // Non-expiring item stays out of the "want using soon" card.
    expect(screen.queryByText('Soba noodles')).toBeNull();
  });

  it('navigates to generate with the typed prompt + weirdness on submit', async () => {
    render(<HomeScreen user={user} items={items} />);
    await userEvent.type(screen.getByLabelText(s.eyebrow), 'cozy carrots');
    await userEvent.click(screen.getByRole('button', { name: s.submit }));
    expect(navigate).toHaveBeenCalledTimes(1);
    const arg = navigate.mock.calls[0]?.[0] as { to: string; search: { prompt: string; weirdness: number } };
    expect(arg.to).toBe('/cook/generate');
    expect(arg.search.prompt).toBe('cozy carrots');
    expect(typeof arg.search.weirdness).toBe('number');
  });

  it('appends an active suggestion to the submitted prompt', async () => {
    render(<HomeScreen user={user} items={items} />);
    await userEvent.type(screen.getByLabelText(s.eyebrow), 'dinner');
    await userEvent.click(screen.getByRole('button', { name: new RegExp(s.suggestions[0]) }));
    await userEvent.click(screen.getByRole('button', { name: s.submit }));
    const arg = navigate.mock.calls[0]?.[0] as { search: { prompt: string } };
    expect(arg.search.prompt).toContain('dinner');
    expect(arg.search.prompt).toContain(s.suggestions[0]);
  });

  it('does not navigate when the prompt is empty', async () => {
    render(<HomeScreen user={user} items={items} />);
    await userEvent.click(screen.getByRole('button', { name: s.submit }));
    expect(navigate).not.toHaveBeenCalled();
  });
});
