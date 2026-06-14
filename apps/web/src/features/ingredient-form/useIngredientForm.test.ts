import type { PantryItem } from '@pantry/contracts';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIngredientForm } from './useIngredientForm';

const navigate = vi.fn();
const invalidate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useRouter: () => ({ invalidate }),
}));

const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();
vi.mock('../../lib/api', () => ({
  api: {
    pantry: {
      create: { mutate: (...args: unknown[]) => create(...args) as unknown },
      update: { mutate: (...args: unknown[]) => update(...args) as unknown },
      remove: { mutate: (...args: unknown[]) => remove(...args) as unknown },
    },
  },
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

describe('useIngredientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue({ ...milkItem, id: 'created' });
    update.mockResolvedValue(milkItem);
    remove.mockResolvedValue({ id: milkItem.id });
    invalidate.mockResolvedValue(undefined);
  });

  it('initializes fields from a loaded item in edit mode', () => {
    const { result } = renderHook(() => useIngredientForm(milkItem));
    expect(result.current.isEditing).toBe(true);
    expect(result.current.values.name).toBe('Whole milk');
    expect(result.current.values.brand).toBe('Strauss');
    expect(result.current.values.quantity).toBe('0.5');
    expect(result.current.values.unit).toBe('gallon');
    expect(result.current.values.category).toBe('dairy');
    expect(result.current.values.location).toBe('fridge_top');
    expect(result.current.values.purchasedAt).toBe('2026-04-16');
    expect(result.current.values.bestBy).toBe('2026-04-23');
    expect(result.current.values.notes).toBe('Use soon.');
  });

  it('uses empty defaults in create mode', () => {
    const { result } = renderHook(() => useIngredientForm());
    expect(result.current.isEditing).toBe(false);
    expect(result.current.values.name).toBe('');
    expect(result.current.values.unit).toBe('ea');
    expect(result.current.values.category).toBe('produce');
    expect(result.current.values.location).toBe('counter');
  });

  it('save() in edit mode updates with a numeric quantity then navigates', async () => {
    const { result } = renderHook(() => useIngredientForm(milkItem));
    act(() => {
      result.current.setField('name', 'Skim milk');
    });
    await act(() => result.current.save());
    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload['id']).toBe(milkItem.id);
    expect(payload['name']).toBe('Skim milk');
    expect(payload['quantity']).toBe(0.5);
    expect(invalidate).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({ to: '/pantry' });
  });

  it('save() in create mode creates with mapped values', async () => {
    const { result } = renderHook(() => useIngredientForm());
    act(() => {
      result.current.setField('name', 'Eggs');
      result.current.setField('quantity', '12');
    });
    await act(() => result.current.save());
    expect(create).toHaveBeenCalledTimes(1);
    const payload = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload['name']).toBe('Eggs');
    expect(payload['quantity']).toBe(12);
    expect(payload['brand']).toBeNull();
    expect(navigate).toHaveBeenCalledWith({ to: '/pantry' });
  });

  it('does not submit an invalid create (empty name)', async () => {
    const { result } = renderHook(() => useIngredientForm());
    await act(() => result.current.save());
    expect(create).not.toHaveBeenCalled();
    expect(result.current.error).toBeDefined();
  });

  it('remove() deletes by id then navigates', async () => {
    const { result } = renderHook(() => useIngredientForm(milkItem));
    await act(() => result.current.remove());
    expect(remove).toHaveBeenCalledWith({ id: milkItem.id });
    expect(invalidate).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({ to: '/pantry' });
  });

  it('cancel() navigates back to the pantry', async () => {
    const { result } = renderHook(() => useIngredientForm(milkItem));
    await act(() => result.current.cancel());
    expect(navigate).toHaveBeenCalledWith({ to: '/pantry' });
  });
});
