import type { RecipeListItem } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { libraryStrings } from '../strings';
import { RecipeLibraryScreen } from './RecipeLibraryScreen';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, params }: { children: unknown; params?: { recipeId?: string } }) => {
    const href = params?.recipeId !== undefined ? `/recipes/${params.recipeId}` : '#';
    return <a href={href}>{children as never}</a>;
  },
}));

function makeItem(overrides: Partial<RecipeListItem> = {}): RecipeListItem {
  return {
    id: crypto.randomUUID(),
    title: 'Charred scallion oil noodles',
    summary: 'A weeknight rerun done right.',
    timeMinutes: 12,
    difficulty: 'easy',
    weirdness: 38,
    pantryItemsUsed: ['scallions'],
    favorited: false,
    createdAt: '2026-06-15T00:00:00.000Z',
    ...overrides,
  };
}

const user = { name: 'Mara Quinn', email: 'mara@example.com' };

describe('RecipeLibraryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state with both context cards when there are no recipes', () => {
    render(<RecipeLibraryScreen user={user} items={[]} />);
    expect(screen.getByText(libraryStrings.headlineLead)).toBeTruthy();
    expect(screen.getByText(libraryStrings.pickEyebrow)).toBeTruthy();
    expect(screen.getByText(libraryStrings.cookNewEyebrow)).toBeTruthy();
  });

  it('renders one card per recipe with a link to its detail page', () => {
    const a = makeItem({ title: 'Recipe A' });
    const b = makeItem({ title: 'Recipe B' });
    render(<RecipeLibraryScreen user={user} items={[a, b]} />);
    const linkA = screen.getByRole('link', { name: /Recipe A/ });
    expect(linkA.getAttribute('href')).toBe(`/recipes/${a.id}`);
    expect(screen.getByRole('link', { name: /Recipe B/ })).toBeTruthy();
  });

  it('marks favorited recipes with a saved badge', () => {
    render(<RecipeLibraryScreen user={user} items={[makeItem({ title: 'Faved', favorited: true })]} />);
    expect(screen.getByLabelText(libraryStrings.savedBadge)).toBeTruthy();
  });

  it('filters to favorites when the Favorites pill is selected', async () => {
    const faved = makeItem({ title: 'Keeper', favorited: true });
    const plain = makeItem({ title: 'Throwaway', favorited: false });
    render(<RecipeLibraryScreen user={user} items={[faved, plain]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Favorites' }));
    expect(screen.getByRole('link', { name: /Keeper/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Throwaway/ })).toBeNull();
  });
});
