import type { PantryItem } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('expo-router', () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

function makeItem(id: string, name: string, category: PantryItem['category']): PantryItem {
  return {
    id,
    name,
    brand: null,
    quantity: 1,
    unit: 'ea',
    category,
    location: 'fridge_top',
    purchasedAt: null,
    bestBy: null,
    notes: null,
    createdAt: '2026-06-13T00:00:00.000Z',
    updatedAt: '2026-06-13T00:00:00.000Z',
  };
}

const items = [makeItem('a', 'Whole milk', 'dairy'), makeItem('b', 'Carrots', 'produce')];

vi.mock('../useCookSelection', () => ({
  useCookSelection: () => ({
    count: 2,
    isSelected: () => false,
    toggle: vi.fn(),
    selectedItems: () => items,
  }),
}));

vi.mock('../usePantry', () => ({
  usePantry: () => ({ items, needsUsing: items, fresh: [], expiringCount: 0 }),
}));

import { PantryScreen } from './PantryScreen';

describe('PantryScreen', () => {
  it('navigates to generation with the selected pantry item ids when Cook is pressed', () => {
    render(<PantryScreen />);
    fireEvent.click(screen.getByTestId('cook-button'));
    expect(push).toHaveBeenCalledWith({ pathname: '/generate', params: { items: 'a,b' } });
  });

  it('filters the list by the search query', () => {
    render(<PantryScreen />);
    expect(screen.getByText('Carrots')).toBeTruthy();
    fireEvent.click(screen.getByTestId('pantry-search-toggle'));
    fireEvent.change(screen.getByTestId('pantry-search-input'), { target: { value: 'milk' } });
    expect(screen.getByText('Whole milk')).toBeTruthy();
    expect(screen.queryByText('Carrots')).toBeNull();
  });
});
