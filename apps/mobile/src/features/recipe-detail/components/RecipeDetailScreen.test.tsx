import type { RecipeDetail } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recipeDetailStrings } from '../strings';
import { RecipeDetailScreen } from './RecipeDetailScreen';

const mutate = vi.fn();
vi.mock('../../../lib/api', () => ({
  api: { recipes: { setFavorite: { mutate: (input: unknown): Promise<unknown> => mutate(input) as Promise<unknown> } } },
}));

function makeRecipe(overrides: Partial<RecipeDetail> = {}): RecipeDetail {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user_1',
    prompt: 'noodles',
    weirdness: 38,
    createdAt: '2026-06-15T00:00:00.000Z',
    favorited: false,
    title: 'Charred scallion oil noodles',
    summary: 'A weeknight rerun done right.',
    weirdnessScore: 38,
    ingredients: [
      { name: 'Scallions', quantity: 1, unit: 'bunch', optional: false, note: null },
      { name: 'Soba noodles', quantity: 200, unit: 'g', optional: false, note: null },
      { name: 'Lime', quantity: null, unit: null, optional: true, note: null },
    ],
    steps: [{ text: 'Boil water.' }, { text: 'Fry the scallion whites.' }],
    timeMinutes: 12,
    difficulty: 'easy',
    substitutions: [],
    pantryItemsUsed: ['scallions', 'soba noodles'],
    confidence: 0.8,
    caveats: [],
    whySuggested: 'Uses your scallions.',
    observation: null,
    ...overrides,
  };
}

describe('RecipeDetailScreen (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutate.mockResolvedValue({ favorited: true });
  });

  it('renders the title, ingredients, in-pantry pill and method', () => {
    render(<RecipeDetailScreen recipe={makeRecipe()} onBack={vi.fn()} />);
    expect(screen.getByText('Charred scallion oil noodles')).toBeTruthy();
    expect(screen.getByText('Scallions')).toBeTruthy();
    expect(screen.getByText(recipeDetailStrings.inPantryPill(2, 3))).toBeTruthy();
    expect(screen.getByText('Boil water.')).toBeTruthy();
  });

  it('persists a favorite when the bookmark is tapped', () => {
    render(<RecipeDetailScreen recipe={makeRecipe({ favorited: false })} onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('favorite-button'));
    expect(mutate).toHaveBeenCalledWith({ recipeId: '123e4567-e89b-12d3-a456-426614174000', favorited: true });
  });

  it('calls onBack when the chevron is tapped', () => {
    const onBack = vi.fn();
    render(<RecipeDetailScreen recipe={makeRecipe()} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('recipe-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
