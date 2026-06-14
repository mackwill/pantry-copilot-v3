import type { PantryItem } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InventoryTable } from './components/InventoryTable';
import { inventoryStrings } from './strings';

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

const warningItem = makeItem({
  name: 'Whole milk',
  quantity: 1,
  unit: 'gallon',
  category: 'dairy',
  location: 'fridge_top',
  bestBy: isoIn(2),
});
const successItem = makeItem({ name: 'Soba noodles', category: 'pantry', bestBy: isoIn(180) });

describe('InventoryTable', () => {
  it('renders the board column headers', () => {
    render(<InventoryTable items={[warningItem, successItem]} />);
    const c = inventoryStrings.columns;
    for (const header of [c.item, c.qty, c.category, c.location, c.status, c.added]) {
      expect(screen.getByText(header)).toBeTruthy();
    }
  });

  it('renders item names and label-mapped cells', () => {
    render(<InventoryTable items={[warningItem, successItem]} />);
    expect(screen.getByText('Whole milk')).toBeTruthy();
    expect(screen.getByText('Soba noodles')).toBeTruthy();
    expect(screen.getByText('1 gal')).toBeTruthy();
    expect(screen.getByText('Dairy')).toBeTruthy();
  });

  it('renders a freshness status pill for the warning item', () => {
    render(<InventoryTable items={[warningItem, successItem]} />);
    expect(screen.getByText('2 days')).toBeTruthy();
  });
});
