import type { PantryItem } from '@pantry/contracts';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCookSelection } from './useCookSelection';

function makeItem(id: string): PantryItem {
  return {
    id,
    name: `Item ${id}`,
    brand: null,
    quantity: 1,
    unit: 'ea',
    category: 'produce',
    location: 'counter',
    purchasedAt: null,
    bestBy: null,
    notes: null,
    createdAt: '2026-06-13T00:00:00.000Z',
    updatedAt: '2026-06-13T00:00:00.000Z',
  };
}

describe('useCookSelection', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useCookSelection());
    expect(result.current.count).toBe(0);
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('toggles an id on and off', () => {
    const { result } = renderHook(() => useCookSelection());
    act(() => {
      result.current.toggle('a');
    });
    expect(result.current.count).toBe(1);
    expect(result.current.isSelected('a')).toBe(true);
    act(() => {
      result.current.toggle('a');
    });
    expect(result.current.count).toBe(0);
    expect(result.current.isSelected('a')).toBe(false);
  });

  it('resolves selectedItems against a list in list order', () => {
    const { result } = renderHook(() => useCookSelection());
    act(() => {
      result.current.toggle('c');
      result.current.toggle('a');
    });
    const items = [makeItem('a'), makeItem('b'), makeItem('c')];
    const selected = result.current.selectedItems(items);
    expect(selected.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('clears the selection', () => {
    const { result } = renderHook(() => useCookSelection());
    act(() => {
      result.current.toggle('a');
      result.current.toggle('b');
    });
    expect(result.current.count).toBe(2);
    act(() => {
      result.current.clear();
    });
    expect(result.current.count).toBe(0);
    expect(result.current.selectedIds).toEqual([]);
  });
});
