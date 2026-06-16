import type { RecipeDetail } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recipeDetailStrings } from '../strings';
import { RecipeDetailScreen } from './RecipeDetailScreen';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

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
    substitutions: [{ ingredient: 'Lime', suggestion: 'Rice vinegar', reason: null }],
    pantryItemsUsed: ['scallions', 'soba noodles'],
    confidence: 0.8,
    caveats: [],
    whySuggested: 'Uses your scallions.',
    observation: 'Anchovy would push this further.',
    ...overrides,
  };
}

const user = { name: 'Mara Quinn', email: 'mara@example.com' };

describe('RecipeDetailScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutate.mockResolvedValue({ favorited: true });
  });

  it('renders the title, summary, method steps and ingredients', () => {
    render(<RecipeDetailScreen user={user} recipe={makeRecipe()} />);
    expect(screen.getByText('Charred scallion oil noodles')).toBeTruthy();
    expect(screen.getByText('A weeknight rerun done right.')).toBeTruthy();
    expect(screen.getByText('Boil water.')).toBeTruthy();
    expect(screen.getByText('Scallions')).toBeTruthy();
    expect(screen.getByText('Soba noodles')).toBeTruthy();
  });

  it('shows the in-pantry count pill (non-optional ingredients)', () => {
    render(<RecipeDetailScreen user={user} recipe={makeRecipe()} />);
    // 2 of 3 ingredients are non-optional → "2 of 3 in pantry"
    expect(screen.getByText(recipeDetailStrings.inPantryPill(2, 3))).toBeTruthy();
  });

  it('persists a favorite when Save is clicked', async () => {
    render(<RecipeDetailScreen user={user} recipe={makeRecipe({ favorited: false })} />);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(recipeDetailStrings.save) }));
    expect(mutate).toHaveBeenCalledWith({ recipeId: '123e4567-e89b-12d3-a456-426614174000', favorited: true });
  });
});
