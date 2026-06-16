import type { RecipeListItem } from '@pantry/contracts';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export interface UseLibrary {
  items: RecipeListItem[];
  loading: boolean;
  error: boolean;
}

/** Loads the caller's recipe library (newest first) for the Cook tab. */
export function useLibrary(): UseLibrary {
  const [items, setItems] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api.recipes.list
      .query({})
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

  return { items, loading, error };
}
