import { describe, expect, it } from 'vitest';
import {
  recipeByIdInputSchema,
  recipeDetailSchema,
  recipeLibraryFilterSchema,
  recipeListItemSchema,
  recipeListQuerySchema,
  setFavoriteInputSchema,
} from './library';
import { aiRecipeSchema } from './recipe';

const baseRecipe = {
  title: 'Charred scallion oil noodles',
  summary: 'A weeknight rerun done right.',
  weirdnessScore: 38,
  ingredients: [{ name: 'Scallions' }],
  steps: ['Boil water.'],
  timeMinutes: 12,
  difficulty: 'easy' as const,
  whySuggested: 'Uses your scallions.',
};

describe('recipeLibraryFilterSchema', () => {
  it('accepts the known filters and rejects others', () => {
    expect(recipeLibraryFilterSchema.parse('favorites')).toBe('favorites');
    expect(() => recipeLibraryFilterSchema.parse('want-to-try')).toThrow();
  });
});

describe('recipeListQuerySchema', () => {
  it('defaults filter=all and limit=50', () => {
    expect(recipeListQuerySchema.parse({})).toEqual({ filter: 'all', limit: 50 });
  });
  it('rejects a limit above 100', () => {
    expect(() => recipeListQuerySchema.parse({ limit: 500 })).toThrow();
  });
});

describe('recipeListItemSchema', () => {
  it('parses a compact list row', () => {
    const row = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'X',
      summary: null,
      timeMinutes: 12,
      difficulty: 'easy',
      weirdness: 38,
      pantryItemsUsed: ['scallions'],
      favorited: true,
      createdAt: '2026-06-15T00:00:00.000Z',
    };
    expect(recipeListItemSchema.parse(row).favorited).toBe(true);
  });
});

describe('recipeDetailSchema', () => {
  it('is the AI recipe + persistence identity + favorited', () => {
    const recipe = aiRecipeSchema.parse(baseRecipe);
    const detail = recipeDetailSchema.parse({
      ...recipe,
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user_1',
      prompt: 'noodles',
      weirdness: 38,
      createdAt: '2026-06-15T00:00:00.000Z',
      favorited: false,
      version: 1,
      tweakCount: 0,
    });
    expect(detail.favorited).toBe(false);
    expect(detail.title).toBe(baseRecipe.title);
    expect(detail.version).toBe(1);
  });
});

describe('setFavoriteInputSchema + recipeByIdInputSchema', () => {
  it('require a uuid recipeId', () => {
    expect(() => setFavoriteInputSchema.parse({ recipeId: 'nope', favorited: true })).toThrow();
    expect(recipeByIdInputSchema.parse({ recipeId: '123e4567-e89b-12d3-a456-426614174000' }).recipeId).toMatch(
      /^123e4567/,
    );
  });
});
