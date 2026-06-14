import {
  createPantryItemInput,
  updatePantryItemInput,
  type PantryCategory,
  type PantryItem,
  type PantryLocation,
  type PantryUnit,
} from '@pantry/contracts';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { api } from '../../lib/api';

export interface IngredientFormValues {
  name: string;
  brand: string;
  quantity: string;
  unit: PantryUnit;
  category: PantryCategory;
  location: PantryLocation;
  purchasedAt: string;
  bestBy: string;
  notes: string;
}

export type IngredientField = keyof IngredientFormValues;

function initialValues(item?: PantryItem): IngredientFormValues {
  if (item === undefined) {
    return {
      name: '',
      brand: '',
      quantity: '',
      unit: 'ea',
      category: 'produce',
      location: 'counter',
      purchasedAt: '',
      bestBy: '',
      notes: '',
    };
  }
  return {
    name: item.name,
    brand: item.brand ?? '',
    quantity: String(item.quantity),
    unit: item.unit,
    category: item.category,
    location: item.location,
    purchasedAt: item.purchasedAt ?? '',
    bestBy: item.bestBy ?? '',
    notes: item.notes ?? '',
  };
}

const emptyToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());

export function useIngredientForm(item?: PantryItem) {
  const navigate = useNavigate();
  const router = useRouter();
  const [values, setValues] = useState<IngredientFormValues>(() => initialValues(item));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const isEditing = item !== undefined;

  const setField = <K extends IngredientField>(field: K, value: IngredientFormValues[K]): void => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const goToPantry = async (): Promise<void> => {
    await router.invalidate();
    await navigate({ to: '/pantry' });
  };

  const save = async (): Promise<void> => {
    const candidate = {
      name: values.name,
      brand: emptyToNull(values.brand),
      quantity: Number(values.quantity),
      unit: values.unit,
      category: values.category,
      location: values.location,
      purchasedAt: emptyToNull(values.purchasedAt),
      bestBy: emptyToNull(values.bestBy),
      notes: emptyToNull(values.notes),
    };

    if (isEditing) {
      const parsed = updatePantryItemInput.safeParse({ id: item.id, ...candidate });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Invalid input');
        return;
      }
      setError(undefined);
      setPending(true);
      await api.pantry.update.mutate(parsed.data);
    } else {
      const parsed = createPantryItemInput.safeParse(candidate);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Invalid input');
        return;
      }
      setError(undefined);
      setPending(true);
      await api.pantry.create.mutate(parsed.data);
    }
    setPending(false);
    await goToPantry();
  };

  const remove = async (): Promise<void> => {
    if (!isEditing) return;
    setPending(true);
    await api.pantry.remove.mutate({ id: item.id });
    setPending(false);
    await goToPantry();
  };

  const cancel = async (): Promise<void> => {
    await navigate({ to: '/pantry' });
  };

  return { values, setField, isEditing, pending, error, save, remove, cancel };
}
