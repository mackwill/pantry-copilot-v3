import { describe, expect, it } from 'vitest';
import { recipeTweakEventSchema } from '../index';

const base = { seq: 2, t: 240 };
const validRecipe = {
  title: 'Soup',
  summary: 's',
  weirdnessScore: 10,
  ingredients: [{ name: 'Water' }],
  steps: ['Boil'],
  timeMinutes: 5,
  difficulty: 'easy' as const,
  whySuggested: 'why',
};

describe('recipeTweakEventSchema', () => {
  it('parses a tweak_summary event', () => {
    const e = recipeTweakEventSchema.parse({ type: 'tweak_summary', text: 'Lighter…', ...base });
    expect(e.type === 'tweak_summary' && e.text).toBe('Lighter…');
  });
  it('parses a tweak_recipe_partial event and defaults complete to false', () => {
    const e = recipeTweakEventSchema.parse({
      type: 'tweak_recipe_partial',
      recipe: { title: 'Soup' },
      ...base,
    });
    expect(e.type === 'tweak_recipe_partial' && e.complete).toBe(false);
  });
  it('parses a tweak_done event and defaults recipeId to null', () => {
    const e = recipeTweakEventSchema.parse({
      type: 'tweak_done',
      response: {
        summary: 'Halved the oil',
        changes: [{ tag: 'change', text: 'Halved the oil' }],
        updatedRecipe: validRecipe,
      },
      turn: 0,
      version: 2,
      ...base,
    });
    expect(e.type === 'tweak_done' && e.recipeId).toBeNull();
  });
  it('reuses the generation error and aborted shapes', () => {
    expect(recipeTweakEventSchema.parse({ type: 'error', code: 'timeout', message: 'slow', ...base }).type).toBe(
      'error',
    );
    expect(recipeTweakEventSchema.parse({ type: 'aborted', ...base }).type).toBe('aborted');
  });
  it('rejects an unknown event type and a non-positive version', () => {
    expect(recipeTweakEventSchema.safeParse({ type: 'mystery', ...base }).success).toBe(false);
    expect(
      recipeTweakEventSchema.safeParse({
        type: 'tweak_done',
        response: { summary: 's', changes: [{ tag: 'note', text: 'x' }], updatedRecipe: validRecipe },
        turn: 0,
        version: 0,
        ...base,
      }).success,
    ).toBe(false);
  });
});
