import { describe, expect, it } from 'vitest';
import { parsePartialRecipe } from './partial-recipe.js';

describe('parsePartialRecipe', () => {
  it('returns null for empty / whitespace input', () => {
    expect(parsePartialRecipe('')).toBeNull();
    expect(parsePartialRecipe('   ')).toBeNull();
  });
  it('parses a complete recipe object', () => {
    const recipe = parsePartialRecipe('{"title":"Soup","summary":"warm"}');
    expect(recipe?.title).toBe('Soup');
    expect(recipe?.summary).toBe('warm');
  });
  it('recovers a recipe truncated mid-object', () => {
    const recipe = parsePartialRecipe('{"title":"Skillet greens","ingredients":[{"name":"Spinach"}],"sum');
    expect(recipe?.title).toBe('Skillet greens');
    expect(recipe?.ingredients?.[0]?.name).toBe('Spinach');
  });
  it('recovers up to the last complete field when truncated mid-string value', () => {
    const recipe = parsePartialRecipe('{"title":"Soup","summary":"war');
    expect(recipe?.title).toBe('Soup');
    expect(recipe?.summary).toBeUndefined();
  });
  it('yields monotonically richer snapshots as fragments accrue', () => {
    const a = parsePartialRecipe('{"title":"Soup"');
    const b = parsePartialRecipe('{"title":"Soup","timeMinutes":12,');
    expect(a?.timeMinutes).toBeUndefined();
    expect(b?.timeMinutes).toBe(12);
  });
  it('returns null on irrecoverable input (unmatched closer)', () => {
    expect(parsePartialRecipe('}}}')).toBeNull();
  });
});
