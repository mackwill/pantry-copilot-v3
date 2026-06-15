import { describe, expect, it } from 'vitest';
import {
  aiRecipePartialSchema,
  aiRecipeSchema,
  generationRequestSchema,
  recipeIngredientSchema,
  recipeSchema,
} from '../index';

const FULL_RECIPE = {
  title: 'Skillet greens',
  summary: 'A fast weeknight pan of greens.',
  weirdnessScore: 30,
  ingredients: [{ name: 'Spinach', quantity: 2, unit: 'cup', optional: false, note: null }],
  steps: ['Wilt the spinach.'],
  timeMinutes: 12,
  difficulty: 'easy',
  whySuggested: 'Uses what is about to expire.',
};

describe('recipeIngredientSchema', () => {
  it('accepts a minimal ingredient and defaults the optional fields', () => {
    const parsed = recipeIngredientSchema.parse({ name: 'Eggs' });
    expect(parsed).toEqual({ name: 'Eggs', quantity: null, unit: null, optional: false, note: null });
  });
  it('rejects an ingredient with no name', () => {
    expect(recipeIngredientSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('aiRecipeSchema', () => {
  it('parses a full recipe and applies array/confidence defaults', () => {
    const parsed = aiRecipeSchema.parse(FULL_RECIPE);
    expect(parsed.substitutions).toEqual([]);
    expect(parsed.pantryItemsUsed).toEqual([]);
    expect(parsed.caveats).toEqual([]);
    expect(parsed.confidence).toBe(0.7);
    expect(parsed.observation).toBeNull();
  });
  it('requires the full field set (rejects a title-only object)', () => {
    expect(aiRecipeSchema.safeParse({ title: 'Just a title' }).success).toBe(false);
  });
  it('requires at least one ingredient and one step', () => {
    expect(aiRecipeSchema.safeParse({ ...FULL_RECIPE, ingredients: [] }).success).toBe(false);
    expect(aiRecipeSchema.safeParse({ ...FULL_RECIPE, steps: [] }).success).toBe(false);
  });
});

describe('aiRecipePartialSchema', () => {
  it('accepts a title-only mid-stream snapshot', () => {
    const parsed = aiRecipePartialSchema.parse({ title: 'Skillet' });
    expect(parsed.title).toBe('Skillet');
  });
  it('accepts an empty snapshot', () => {
    expect(aiRecipePartialSchema.safeParse({}).success).toBe(true);
  });
});

describe('recipeSchema (persisted DTO)', () => {
  it('extends the AI recipe with persistence identity', () => {
    const parsed = recipeSchema.parse({
      ...FULL_RECIPE,
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: 'user-1',
      prompt: 'something green',
      weirdness: 30,
      createdAt: '2026-06-14T00:00:00.000Z',
    });
    expect(parsed.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(parsed.title).toBe('Skillet greens');
  });
  it('rejects a recipe missing its id', () => {
    expect(recipeSchema.safeParse(FULL_RECIPE).success).toBe(false);
  });
});

describe('generationRequestSchema', () => {
  it('accepts a valid request and defaults pantryItemIds', () => {
    const parsed = generationRequestSchema.parse({ prompt: 'cozy soup', weirdness: 40 });
    expect(parsed.pantryItemIds).toEqual([]);
    expect(parsed.weirdness).toBe(40);
  });
  it('rejects an empty prompt', () => {
    expect(generationRequestSchema.safeParse({ prompt: '   ', weirdness: 40 }).success).toBe(false);
  });
  it('rejects weirdness outside 0–100', () => {
    expect(generationRequestSchema.safeParse({ prompt: 'x', weirdness: 140 }).success).toBe(false);
    expect(generationRequestSchema.safeParse({ prompt: 'x', weirdness: -1 }).success).toBe(false);
  });
  it('rejects a non-uuid pantry item id', () => {
    expect(generationRequestSchema.safeParse({ prompt: 'x', weirdness: 10, pantryItemIds: ['nope'] }).success).toBe(false);
  });
});
