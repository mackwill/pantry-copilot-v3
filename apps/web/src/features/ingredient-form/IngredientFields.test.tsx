import type { PantryItem } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IngredientFields } from './components/IngredientFields';
import { ingredientStrings } from './strings';
import { useIngredientForm } from './useIngredientForm';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({ invalidate: vi.fn() }),
}));
vi.mock('../../lib/api', () => ({
  api: { pantry: { create: { mutate: vi.fn() }, update: { mutate: vi.fn() }, remove: { mutate: vi.fn() } } },
}));

const milkItem: PantryItem = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Whole milk',
  brand: 'Strauss',
  quantity: 0.5,
  unit: 'gallon',
  category: 'dairy',
  location: 'fridge_top',
  purchasedAt: '2026-04-16',
  bestBy: '2026-04-23',
  notes: 'Use soon.',
  createdAt: '2026-04-16T00:00:00.000Z',
  updatedAt: '2026-04-16T00:00:00.000Z',
};

function Harness({ item }: { item?: PantryItem }) {
  const form = useIngredientForm(item);
  return <IngredientFields values={form.values} setField={form.setField} />;
}

describe('IngredientFields', () => {
  it('renders every board field label', () => {
    render(<Harness item={milkItem} />);
    const f = ingredientStrings.fields;
    for (const label of [f.name, f.brand, f.quantity, f.unit, f.category, f.location, f.purchased, f.bestBy, f.notes]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  function valueOf(label: string): string {
    const el = screen.getByLabelText(label);
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) return el.value;
    throw new Error(`expected a form control for label "${label}"`);
  }

  it('populates inputs from the loaded item', () => {
    render(<Harness item={milkItem} />);
    expect(valueOf(ingredientStrings.fields.name)).toBe('Whole milk');
    expect(valueOf(ingredientStrings.fields.brand)).toBe('Strauss');
    expect(valueOf(ingredientStrings.fields.quantity)).toBe('0.5');
  });

  it('reflects enum selects by their stored value', () => {
    render(<Harness item={milkItem} />);
    expect(valueOf(ingredientStrings.fields.unit)).toBe('gallon');
    expect(valueOf(ingredientStrings.fields.category)).toBe('dairy');
    expect(screen.getByRole('option', { name: 'Dairy' }).getAttribute('value')).toBe('dairy');
  });
});
