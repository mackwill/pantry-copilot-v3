import type { PantryItem, RecipeIngredient } from '@pantry/contracts';
import { describe, expect, it } from 'vitest';
import { buildConsumeRows, toConsumeItems } from './consumeRows';

function pantryItem(overrides: Partial<PantryItem> & Pick<PantryItem, 'id' | 'name' | 'quantity' | 'unit'>): PantryItem {
  return {
    brand: null,
    category: 'pantry',
    location: 'pantry_upper',
    purchasedAt: null,
    bestBy: null,
    notes: null,
    createdAt: '2026-06-16T00:00:00.000Z',
    updatedAt: '2026-06-16T00:00:00.000Z',
    ...overrides,
  };
}

function ingredient(name: string, quantity: number | null): RecipeIngredient {
  return { name, quantity, unit: null, optional: false, note: null };
}

describe('buildConsumeRows', () => {
  it('matches ingredients to pantry items and seeds the recipe quantity (clamped to stock)', () => {
    const { rows, missing } = buildConsumeRows(
      [ingredient('Rice', 2), ingredient('Butter', 5)],
      [
        pantryItem({ id: 'p1', name: 'Rice', quantity: 3, unit: 'cup' }),
        pantryItem({ id: 'p2', name: 'Butter', quantity: 1, unit: 'stick' }),
      ],
    );
    expect(missing).toEqual([]);
    expect(rows[0]).toMatchObject({ pantryItemId: 'p1', quantityUsed: 2, finished: false });
    // Recipe wanted 5 but only 1 in stock → clamped + finished.
    expect(rows[1]).toMatchObject({ pantryItemId: 'p2', quantityUsed: 1, finished: true });
  });

  it('lists ingredients with no pantry match as missing', () => {
    const { rows, missing } = buildConsumeRows(
      [ingredient('Black pepper', 1)],
      [pantryItem({ id: 'p1', name: 'Rice', quantity: 3, unit: 'cup' })],
    );
    expect(rows).toEqual([]);
    expect(missing).toEqual(['Black pepper']);
  });

  it('projects rows into the consume contract shape', () => {
    const { rows } = buildConsumeRows(
      [ingredient('Rice', 2)],
      [pantryItem({ id: 'p1', name: 'Rice', quantity: 3, unit: 'cup' })],
    );
    expect(toConsumeItems(rows)).toEqual([{ pantryItemId: 'p1', quantityUsed: 2, unit: 'cup', finished: false }]);
  });
});
