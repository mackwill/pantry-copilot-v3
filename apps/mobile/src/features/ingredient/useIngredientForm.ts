import {
  createPantryItemInput,
  updatePantryItemInput,
  type PantryCategory,
  type PantryItem,
  type PantryLocation,
  type PantryUnit,
} from '@pantry/contracts';
import { useRouter } from 'expo-router';
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
  bestBy: string | null;
  notes: string;
}

export type IngredientField = keyof IngredientFormValues;

const QUANTITY_STEP = 1;

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
      bestBy: null,
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
    bestBy: item.bestBy,
    notes: item.notes ?? '',
  };
}

const emptyToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());

const stepQuantity = (current: string, delta: number): string => {
  const parsed = Number(current);
  const base = Number.isFinite(parsed) ? parsed : 0;
  return String(Math.max(0, base + delta));
};

export function useIngredientForm(item?: PantryItem) {
  const router = useRouter();
  const [values, setValues] = useState<IngredientFormValues>(() => initialValues(item));
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [bestByOpen, setBestByOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const isEditing = item !== undefined;

  const setField = <K extends IngredientField>(field: K, value: IngredientFormValues[K]): void => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const incQuantity = (): void => {
    setValues((prev) => ({ ...prev, quantity: stepQuantity(prev.quantity, QUANTITY_STEP) }));
  };
  const decQuantity = (): void => {
    setValues((prev) => ({ ...prev, quantity: stepQuantity(prev.quantity, -QUANTITY_STEP) }));
  };

  const candidate = (): Record<string, unknown> => ({
    name: values.name,
    brand: emptyToNull(values.brand),
    quantity: Number(values.quantity),
    unit: values.unit,
    category: values.category,
    location: values.location,
    purchasedAt: emptyToNull(values.purchasedAt),
    bestBy: values.bestBy,
    notes: emptyToNull(values.notes),
  });

  const create = async (): Promise<boolean> => {
    const parsed = createPantryItemInput.safeParse(candidate());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return false;
    }
    setError(undefined);
    setPending(true);
    await api.pantry.create.mutate(parsed.data);
    setPending(false);
    return true;
  };

  const save = async (): Promise<void> => {
    if (isEditing) {
      const parsed = updatePantryItemInput.safeParse({ id: item.id, ...candidate() });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Invalid input');
        return;
      }
      setError(undefined);
      setPending(true);
      await api.pantry.update.mutate(parsed.data);
      setPending(false);
      router.back();
      return;
    }
    const ok = await create();
    if (ok) router.back();
  };

  const saveAndAnother = async (): Promise<void> => {
    const ok = await create();
    if (ok) setValues(initialValues());
  };

  const remove = async (): Promise<void> => {
    if (!isEditing) return;
    setPending(true);
    await api.pantry.remove.mutate({ id: item.id });
    setPending(false);
    router.back();
  };

  const cancel = (): void => {
    router.back();
  };

  return {
    values,
    setField,
    incQuantity,
    decQuantity,
    isEditing,
    pending,
    error,
    categoryOpen,
    locationOpen,
    bestByOpen,
    openCategory: () => {
      setCategoryOpen(true);
    },
    closeCategory: () => {
      setCategoryOpen(false);
    },
    openLocation: () => {
      setLocationOpen(true);
    },
    closeLocation: () => {
      setLocationOpen(false);
    },
    openBestBy: () => {
      setBestByOpen(true);
    },
    closeBestBy: () => {
      setBestByOpen(false);
    },
    save,
    saveAndAnother,
    remove,
    cancel,
  };
}
