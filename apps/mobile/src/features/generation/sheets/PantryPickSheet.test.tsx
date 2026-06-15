import type { PantryItem, PantryCategory, PantryLocation } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PantryPickSheet } from './PantryPickSheet';

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
}

function makeItem(
  id: string,
  name: string,
  category: PantryCategory,
  location: PantryLocation,
  bestBy: string | null,
): PantryItem {
  return {
    id,
    name,
    brand: null,
    quantity: 1,
    unit: 'ea',
    category,
    location,
    purchasedAt: null,
    bestBy,
    notes: null,
    createdAt: '2026-06-13T00:00:00.000Z',
    updatedAt: '2026-06-13T00:00:00.000Z',
  };
}

const items: PantryItem[] = [
  makeItem('milk', 'Whole milk', 'dairy', 'fridge_top', daysFromNow(2)),
  makeItem('carrots', 'Carrots', 'produce', 'fridge_crisper', daysFromNow(60)),
  makeItem('soba', 'Soba noodles', 'pantry', 'pantry_lower', null),
];

function renderSheet(overrides: Partial<React.ComponentProps<typeof PantryPickSheet>> = {}) {
  return render(
    <PantryPickSheet
      open
      items={items}
      isSelected={() => false}
      onToggle={vi.fn()}
      selectedNames={[]}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

describe('PantryPickSheet (mobile)', () => {
  it('groups items into Needs using / Fridge / Pantry', () => {
    renderSheet();
    // "Needs using" is unique to a group header; Fridge/Pantry also appear as
    // filter pills, so assert those groups via their member items instead.
    expect(screen.getByText('Needs using')).toBeTruthy();
    expect(screen.getByText('Whole milk')).toBeTruthy();
    expect(screen.getByText('Carrots')).toBeTruthy();
    expect(screen.getByText('Soba noodles')).toBeTruthy();
  });

  it('filters the list by search query', () => {
    renderSheet();
    fireEvent.change(screen.getByTestId('pantry-search'), { target: { value: 'soba' } });
    expect(screen.getByText('Soba noodles')).toBeTruthy();
    expect(screen.queryByText('Whole milk')).toBeNull();
  });

  it('filters to expiring items via the filter pills', () => {
    renderSheet();
    fireEvent.click(screen.getByTestId('pantry-filter-expiring'));
    expect(screen.getByText('Whole milk')).toBeTruthy();
    expect(screen.queryByText('Carrots')).toBeNull();
    expect(screen.queryByText('Soba noodles')).toBeNull();
  });

  it('toggles an item when its row is pressed', () => {
    const onToggle = vi.fn();
    renderSheet({ onToggle });
    fireEvent.click(screen.getByTestId('expiring-tap-row-milk'));
    expect(onToggle).toHaveBeenCalledWith('milk');
  });

  it('shows the selected count and names and closes on Add to prompt', () => {
    const onClose = vi.fn();
    renderSheet({ selectedNames: ['whole milk', 'scallions'], onClose });
    expect(screen.getByText('2 selected')).toBeTruthy();
    expect(screen.getByText('whole milk, scallions')).toBeTruthy();
    fireEvent.click(screen.getByTestId('add-to-prompt'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
