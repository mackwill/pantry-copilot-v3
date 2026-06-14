import type { PantryItem } from '@pantry/contracts';
import { useCallback, useMemo, useState } from 'react';

export interface CookSelection {
  selectedIds: string[];
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
  selectedItems: (items: PantryItem[]) => PantryItem[];
}

/** Set-based tap-to-cook selection state for the pantry screen. */
export function useCookSelection(): CookSelection {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectedItems = useCallback(
    (items: PantryItem[]) => items.filter((item) => selected.has(item.id)),
    [selected],
  );

  const selectedIds = useMemo(() => [...selected], [selected]);

  return {
    selectedIds,
    count: selected.size,
    isSelected,
    toggle,
    clear,
    selectedItems,
  };
}
