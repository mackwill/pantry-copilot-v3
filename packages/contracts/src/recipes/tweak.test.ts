import { describe, expect, it } from 'vitest';
import {
  recipeChangeSchema,
  recipeRevertInputSchema,
  recipeTweakRequestSchema,
  recipeTweakResponseSchema,
} from '../index';

const validRecipe = {
  title: 'Charred Scallion Oil Noodles',
  summary: 's',
  weirdnessScore: 30,
  ingredients: [{ name: 'Noodles' }],
  steps: ['Boil'],
  timeMinutes: 20,
  difficulty: 'easy' as const,
  whySuggested: 'why',
};

describe('recipeChangeSchema', () => {
  it('parses each valid tag', () => {
    for (const tag of ['change', 'add', 'remove', 'note'] as const) {
      expect(recipeChangeSchema.parse({ tag, text: 'less oil' }).tag).toBe(tag);
    }
  });
  it('rejects an unknown tag', () => {
    expect(recipeChangeSchema.safeParse({ tag: 'delete', text: 'x' }).success).toBe(false);
  });
  it('rejects empty or over-long text', () => {
    expect(recipeChangeSchema.safeParse({ tag: 'note', text: '' }).success).toBe(false);
    expect(recipeChangeSchema.safeParse({ tag: 'note', text: 'x'.repeat(121) }).success).toBe(false);
  });
});

describe('recipeTweakResponseSchema', () => {
  it('parses a full response and flows ingredient tweak flags', () => {
    const r = recipeTweakResponseSchema.parse({
      summary: 'Lighter on the oil, more greens.',
      changes: [{ tag: 'change', text: 'Halved the oil' }],
      updatedRecipe: { ...validRecipe, ingredients: [{ name: 'Spinach', added: true }] },
    });
    expect(r.changes).toHaveLength(1);
    expect(r.updatedRecipe.ingredients[0]?.added).toBe(true);
  });
  it('requires at least one change', () => {
    expect(
      recipeTweakResponseSchema.safeParse({ summary: 's', changes: [], updatedRecipe: validRecipe })
        .success,
    ).toBe(false);
  });
  it('rejects more than eight changes', () => {
    const changes = Array.from({ length: 9 }, () => ({ tag: 'note' as const, text: 'x' }));
    expect(
      recipeTweakResponseSchema.safeParse({ summary: 's', changes, updatedRecipe: validRecipe })
        .success,
    ).toBe(false);
  });
});

describe('recipeTweakRequestSchema / recipeRevertInputSchema', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  it('parses a valid tweak request and trims the prompt', () => {
    const r = recipeTweakRequestSchema.parse({ recipeId: id, prompt: '  less oil  ' });
    expect(r.prompt).toBe('less oil');
  });
  it('rejects a blank prompt and a non-uuid recipeId', () => {
    expect(recipeTweakRequestSchema.safeParse({ recipeId: id, prompt: '   ' }).success).toBe(false);
    expect(recipeTweakRequestSchema.safeParse({ recipeId: 'nope', prompt: 'x' }).success).toBe(false);
  });
  it('parses a revert input', () => {
    expect(recipeRevertInputSchema.parse({ recipeId: id }).recipeId).toBe(id);
  });
});
