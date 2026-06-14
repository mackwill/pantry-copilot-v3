import { PANTRY_CATEGORIES, type PantryCategory, type PantryItem } from '@pantry/contracts';
import { freshnessFor, rankByExpiration } from '@pantry/utils';
import { useMemo, useState } from 'react';

export type CategoryFilter = PantryCategory | 'all';

export interface InventoryStats {
  total: number;
  expiring: number;
  pastPrime: number;
}

export interface UseInventory {
  activeCategory: CategoryFilter;
  setActiveCategory: (category: CategoryFilter) => void;
  categories: readonly PantryCategory[];
  stats: InventoryStats;
  visibleItems: PantryItem[];
  locationsCount: number;
}

/** Inventory view-model over loaded pantry items: stats, category filter, ranked rows. */
export function useInventory(items: PantryItem[]): UseInventory {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const stats = useMemo<InventoryStats>(() => {
    let expiring = 0;
    let pastPrime = 0;
    for (const item of items) {
      const { tone } = freshnessFor(item.bestBy);
      if (tone === 'warning') expiring += 1;
      else if (tone === 'danger') pastPrime += 1;
    }
    return { total: items.length, expiring, pastPrime };
  }, [items]);

  const visibleItems = useMemo<PantryItem[]>(() => {
    const filtered =
      activeCategory === 'all' ? items : items.filter((item) => item.category === activeCategory);
    return rankByExpiration(filtered);
  }, [items, activeCategory]);

  const locationsCount = useMemo<number>(
    () => new Set(items.map((item) => item.location)).size,
    [items],
  );

  return {
    activeCategory,
    setActiveCategory,
    categories: PANTRY_CATEGORIES,
    stats,
    visibleItems,
    locationsCount,
  };
}
