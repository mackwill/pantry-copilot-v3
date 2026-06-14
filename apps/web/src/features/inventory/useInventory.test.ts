import type { PantryItem } from '@pantry/contracts';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInventory } from './useInventory';

// bestBy relative to "today" — the hook ranks/buckets via freshnessFor(bestBy).
const today = new Date();
function isoIn(days: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeItem(overrides: Partial<PantryItem>): PantryItem {
  return {
    id: crypto.randomUUID(),
    name: 'Item',
    brand: null,
    quantity: 1,
    unit: 'ea',
    category: 'pantry',
    location: 'pantry_upper',
    purchasedAt: null,
    bestBy: null,
    notes: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

const warningItem = makeItem({ name: 'Whole milk', category: 'dairy', bestBy: isoIn(2) });
const successItem = makeItem({ name: 'Soba noodles', category: 'pantry', bestBy: isoIn(180) });

describe('useInventory', () => {
  it('derives stats over all items', () => {
    const { result } = renderHook(() => useInventory([warningItem, successItem]));
    expect(result.current.stats.total).toBe(2);
    expect(result.current.stats.expiring).toBe(1);
    expect(result.current.stats.pastPrime).toBe(0);
  });

  it('shows every item under the default "all" category', () => {
    const { result } = renderHook(() => useInventory([warningItem, successItem]));
    expect(result.current.activeCategory).toBe('all');
    expect(result.current.visibleItems).toHaveLength(2);
  });

  it('filters visible items when a category is selected', () => {
    const { result } = renderHook(() => useInventory([warningItem, successItem]));
    act(() => {
      result.current.setActiveCategory('dairy');
    });
    expect(result.current.visibleItems.map((i) => i.name)).toEqual(['Whole milk']);
  });

  it('orders visible items by expiration (most urgent first)', () => {
    const { result } = renderHook(() => useInventory([successItem, warningItem]));
    expect(result.current.visibleItems.map((i) => i.name)).toEqual(['Whole milk', 'Soba noodles']);
  });
});
