import type { RecipeListItem } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { libraryStrings } from '../strings';
import { RecipeLibraryScreen } from './RecipeLibraryScreen';

const push = vi.fn();
vi.mock('expo-router', () => ({ useRouter: () => ({ push }) }));

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

describe('RecipeLibraryScreen (mobile)', () => {
  it('renders the header, counts and one card per recipe', () => {
    render(<RecipeLibraryScreen items={[makeItem({ title: 'Recipe A' }), makeItem({ title: 'Recipe B' })]} />);
    expect(screen.getByText(libraryStrings.headingAccent)).toBeTruthy();
    // Two library cards (plus possible recently-generated rows, which use a different testID).
    expect(screen.getAllByTestId('recipe-card')).toHaveLength(2);
  });

  it('shows the saved count from favorited recipes', () => {
    render(<RecipeLibraryScreen items={[makeItem({ favorited: true }), makeItem({ favorited: false })]} />);
    expect(screen.getByText(libraryStrings.savedCount(1))).toBeTruthy();
  });

  it('opens the NewAskSheet when the New button is tapped', () => {
    render(<RecipeLibraryScreen items={[makeItem()]} />);
    expect(screen.queryByTestId('new-ask-sheet')).toBeNull();
    fireEvent.click(screen.getByTestId('cook-new-button'));
    expect(screen.getByTestId('new-ask-sheet')).toBeTruthy();
  });

  it('filters the library list by the search query', () => {
    render(<RecipeLibraryScreen items={[makeItem({ title: 'Scallion noodles' }), makeItem({ title: 'Tomato soup' })]} />);
    expect(screen.getAllByTestId('recipe-card')).toHaveLength(2);
    fireEvent.click(screen.getByTestId('library-search-toggle'));
    fireEvent.change(screen.getByTestId('library-search-input'), { target: { value: 'soup' } });
    expect(screen.getAllByTestId('recipe-card')).toHaveLength(1);
  });

  it('sorts the list alphabetically when chosen', () => {
    render(<RecipeLibraryScreen items={[makeItem({ title: 'Zucchini bake' }), makeItem({ title: 'Apple crumble' })]} />);
    fireEvent.click(screen.getByTestId('library-sort-toggle'));
    fireEvent.click(screen.getByText(libraryStrings.sort.alpha));
    expect(screen.getAllByTestId('recipe-card')[0]?.textContent).toContain('Apple crumble');
  });

  it('navigates to a recipe when its card is pressed', () => {
    const item = makeItem({ title: 'Openable' });
    render(<RecipeLibraryScreen items={[item]} />);
    fireEvent.click(screen.getAllByTestId('recipe-card')[0]);
    expect(push).toHaveBeenCalledWith(`/${item.id}`);
  });
});
