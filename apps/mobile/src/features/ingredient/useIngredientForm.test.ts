import type { PantryItem } from '@pantry/contracts';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIngredientForm } from './useIngredientForm';

const back = vi.fn();
const push = vi.fn();
vi.mock('expo-router', () => ({
  useRouter: () => ({ back, push }),
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
  brand: 'Clover',
  quantity: 2,
  unit: 'gallon',
  category: 'dairy',
  location: 'fridge_top',
  purchasedAt: '2026-04-16',
  bestBy: '2026-04-23',
  notes: 'Use soon',
  createdAt: '2026-04-16T00:00:00.000Z',
  updatedAt: '2026-04-16T00:00:00.000Z',
};

describe('useIngredientForm (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue({ ...milkItem });
    update.mockResolvedValue({ ...milkItem });
    remove.mockResolvedValue({ ok: true });
  });

  it('initializes fields from the item in edit mode', () => {
    const { result } = renderHook(() => useIngredientForm(milkItem));
    expect(result.current.isEditing).toBe(true);
    expect(result.current.values.name).toBe('Whole milk');
    expect(result.current.values.quantity).toBe('2');
    expect(result.current.values.unit).toBe('gallon');
    expect(result.current.values.category).toBe('dairy');
    expect(result.current.values.location).toBe('fridge_top');
    expect(result.current.values.bestBy).toBe('2026-04-23');
    expect(result.current.values.notes).toBe('Use soon');
  });

  it('defaults to empty values when no item is supplied', () => {
    const { result } = renderHook(() => useIngredientForm());
    expect(result.current.isEditing).toBe(false);
    expect(result.current.values.name).toBe('');
    expect(result.current.values.unit).toBe('ea');
    expect(result.current.values.category).toBe('produce');
    expect(result.current.values.location).toBe('counter');
    expect(result.current.values.bestBy).toBeNull();
  });

  it('toggles picker open flags via the open/close setters', () => {
    const { result } = renderHook(() => useIngredientForm());
    expect(result.current.categoryOpen).toBe(false);
    act(() => {
      result.current.openCategory();
    });
    expect(result.current.categoryOpen).toBe(true);
    act(() => {
      result.current.closeCategory();
    });
    expect(result.current.categoryOpen).toBe(false);

    act(() => {
      result.current.openLocation();
    });
    expect(result.current.locationOpen).toBe(true);
    act(() => {
      result.current.openBestBy();
    });
    expect(result.current.bestByOpen).toBe(true);
  });

  it('steps the quantity up and down with a floor of zero', () => {
    const { result } = renderHook(() => useIngredientForm());
    act(() => {
      result.current.setField('quantity', '1');
    });
    act(() => {
      result.current.incQuantity();
    });
    expect(result.current.values.quantity).toBe('2');
    act(() => {
      result.current.decQuantity();
      result.current.decQuantity();
      result.current.decQuantity();
    });
    expect(result.current.values.quantity).toBe('0');
  });

  it('updates with a mapped numeric quantity and id in edit mode', async () => {
    const { result } = renderHook(() => useIngredientForm(milkItem));
    act(() => {
      result.current.setField('quantity', '3');
    });
    await act(async () => {
      await result.current.save();
    });
    expect(update).toHaveBeenCalledTimes(1);
    const arg = update.mock.calls[0]?.[0] as { id: string; quantity: number };
    expect(arg.id).toBe(milkItem.id);
    expect(arg.quantity).toBe(3);
    expect(back).toHaveBeenCalled();
  });

  it('creates a new item when no item is supplied', async () => {
    const { result } = renderHook(() => useIngredientForm());
    act(() => {
      result.current.setField('name', 'Heavy cream');
      result.current.setField('quantity', '1');
    });
    await act(async () => {
      await result.current.save();
    });
    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0]?.[0] as { name: string; quantity: number };
    expect(arg.name).toBe('Heavy cream');
    expect(arg.quantity).toBe(1);
    expect(back).toHaveBeenCalled();
  });

  it('creates then resets fields on saveAndAnother', async () => {
    const { result } = renderHook(() => useIngredientForm());
    act(() => {
      result.current.setField('name', 'Eggs');
      result.current.setField('quantity', '12');
    });
    await act(async () => {
      await result.current.saveAndAnother();
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.current.values.name).toBe('');
    expect(back).not.toHaveBeenCalled();
  });

  it('removes the item in edit mode', async () => {
    const { result } = renderHook(() => useIngredientForm(milkItem));
    await act(async () => {
      await result.current.remove();
    });
    expect(remove).toHaveBeenCalledWith({ id: milkItem.id });
    expect(back).toHaveBeenCalled();
  });

  it('cancel navigates back', () => {
    const { result } = renderHook(() => useIngredientForm());
    act(() => {
      result.current.cancel();
    });
    expect(back).toHaveBeenCalled();
  });
});
