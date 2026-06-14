import type { PantryItem } from '@pantry/contracts';
import { freshnessFor, rankByExpiration } from '@pantry/utils';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';

export interface UsePantry {
  items: PantryItem[];
  loading: boolean;
  error: boolean;
  needsUsing: PantryItem[];
  fresh: PantryItem[];
  expiringCount: number;
}

/** Loads the pantry and splits it into needs-using / fresh, ranked by expiration. */
export function usePantry(): UsePantry {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api.pantry.list
      .query()
      .then((rows) => {
        if (active) {
          setItems(rows);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const { needsUsing, fresh, expiringCount } = useMemo(() => {
    const needs: PantryItem[] = [];
    const ok: PantryItem[] = [];
    let expiring = 0;
    for (const item of items) {
      const { tone } = freshnessFor(item.bestBy);
      if (tone === 'success') {
        ok.push(item);
      } else {
        needs.push(item);
        if (tone === 'warning') expiring += 1;
      }
    }
    return {
      needsUsing: rankByExpiration(needs),
      fresh: rankByExpiration(ok),
      expiringCount: expiring,
    };
  }, [items]);

  return { items, loading, error, needsUsing, fresh, expiringCount };
}
