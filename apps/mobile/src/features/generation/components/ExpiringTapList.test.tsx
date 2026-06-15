import type { PantryItem } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExpiringTapList } from './ExpiringTapList';

function makeItem(id: string, name: string): PantryItem {
  return {
    id,
    name,
    brand: null,
    quantity: 1,
    unit: 'bunch',
    category: 'produce',
    location: 'fridge_crisper',
    purchasedAt: null,
    bestBy: null,
    notes: null,
    createdAt: '2026-06-13T00:00:00.000Z',
    updatedAt: '2026-06-13T00:00:00.000Z',
  };
}

const items = [makeItem('milk', 'Whole milk'), makeItem('scallions', 'Scallions')];

describe('ExpiringTapList (mobile)', () => {
  it('renders a row per item and the browse link with the pantry count', () => {
    render(
      <ExpiringTapList
        items={items}
        pantryCount={14}
        isSelected={() => false}
        onToggle={vi.fn()}
        onBrowse={vi.fn()}
      />,
    );
    expect(screen.getByText('Whole milk')).toBeTruthy();
    expect(screen.getByText('Scallions')).toBeTruthy();
    expect(screen.getByText('Browse pantry · 14')).toBeTruthy();
  });

  it('toggles an item when its row is pressed', () => {
    const onToggle = vi.fn();
    render(
      <ExpiringTapList
        items={items}
        pantryCount={14}
        isSelected={() => false}
        onToggle={onToggle}
        onBrowse={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId('expiring-tap-row-scallions'));
    expect(onToggle).toHaveBeenCalledWith('scallions');
  });

  it('opens the browse sheet from the link', () => {
    const onBrowse = vi.fn();
    render(
      <ExpiringTapList
        items={items}
        pantryCount={14}
        isSelected={() => false}
        onToggle={vi.fn()}
        onBrowse={onBrowse}
      />,
    );
    fireEvent.click(screen.getByTestId('browse-pantry'));
    expect(onBrowse).toHaveBeenCalledTimes(1);
  });
});
