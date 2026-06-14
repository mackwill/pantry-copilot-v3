import type { ExtractedIngredient } from '@pantry/contracts';
import { describe, expect, it } from 'vitest';
import { dedupeScanIngredients, normalizeScanIngredients } from './scan-normalize.js';

function ing(partial: Partial<ExtractedIngredient> & { name: string; normalizedName: string }): ExtractedIngredient {
  return {
    category: null,
    location: null,
    quantity: null,
    unit: null,
    confidence: 0.8,
    notes: null,
    ...partial,
  };
}

describe('normalizeScanIngredients', () => {
  it('coerces an out-of-enum unit alias (tub → jar) onto our enums', () => {
    const [out] = normalizeScanIngredients([
      { name: 'Yogurt', normalizedName: 'yogurt', unit: 'tub', category: 'dairy', confidence: 0.7 },
    ]);
    expect(out?.unit).toBe('jar');
  });

  it('maps a free-form count alias to "ea"', () => {
    const [out] = normalizeScanIngredients([
      { name: 'Apple', normalizedName: 'apple', unit: 'pieces', category: 'produce', confidence: 0.8 },
    ]);
    expect(out?.unit).toBe('ea');
  });

  it('coerces a generic category alias (meat → protein)', () => {
    const [out] = normalizeScanIngredients([
      { name: 'Chicken', normalizedName: 'chicken', category: 'meat', unit: 'lb', confidence: 0.8 },
    ]);
    expect(out?.category).toBe('protein');
  });

  it('falls back to null for an unmappable unit', () => {
    const [out] = normalizeScanIngredients([
      { name: 'Mystery', normalizedName: 'mystery', unit: 'flagon', confidence: 0.6 },
    ]);
    expect(out?.unit).toBeNull();
  });

  it('drops a nameless item instead of throwing', () => {
    const out = normalizeScanIngredients([{ normalizedName: 'ghost', unit: 'ea' }]);
    expect(out).toHaveLength(0);
  });
});

describe('dedupeScanIngredients', () => {
  it('collapses duplicate flour entries and records the dropped surface name', () => {
    const { ingredients, duplicatesMerged } = dedupeScanIngredients([
      ing({ name: 'Flour', normalizedName: 'flour', quantity: 200, unit: 'g', confidence: 0.7 }),
      ing({ name: 'All-purpose flour', normalizedName: 'flour', quantity: 300, unit: 'g', confidence: 0.9 }),
    ]);
    expect(ingredients).toHaveLength(1);
    expect(duplicatesMerged).toContain('Flour');
  });

  it('sums quantities when units match', () => {
    const { ingredients } = dedupeScanIngredients([
      ing({ name: 'Flour', normalizedName: 'flour', quantity: 200, unit: 'g', confidence: 0.7 }),
      ing({ name: 'Flour', normalizedName: 'flour', quantity: 300, unit: 'g', confidence: 0.9 }),
    ]);
    expect(ingredients[0]?.quantity).toBe(500);
  });

  it('keeps the highest confidence when merging', () => {
    const { ingredients } = dedupeScanIngredients([
      ing({ name: 'Flour', normalizedName: 'flour', quantity: 200, unit: 'g', confidence: 0.7 }),
      ing({ name: 'Flour', normalizedName: 'flour', quantity: 300, unit: 'g', confidence: 0.95 }),
    ]);
    expect(ingredients[0]?.confidence).toBe(0.95);
  });

  it('does not sum quantities across mismatched units', () => {
    const { ingredients } = dedupeScanIngredients([
      ing({ name: 'Milk', normalizedName: 'milk', quantity: 1, unit: 'gallon', confidence: 0.9 }),
      ing({ name: 'Milk', normalizedName: 'milk', quantity: 2, unit: 'cup', confidence: 0.6 }),
    ]);
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0]?.quantity).toBe(1);
  });

  it('leaves distinct ingredients untouched', () => {
    const { ingredients } = dedupeScanIngredients([
      ing({ name: 'Milk', normalizedName: 'milk', unit: 'gallon' }),
      ing({ name: 'Eggs', normalizedName: 'eggs', unit: 'ea' }),
    ]);
    expect(ingredients).toHaveLength(2);
  });
});
