import type { CookSession, RecipeListItem } from '@pantry/contracts';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export interface UseLibrary {
  items: RecipeListItem[];
  activeSession: CookSession | null;
  loading: boolean;
  error: boolean;
}

/** Loads the caller's recipe library (newest first) for the Cook tab. */
export function useLibrary(): UseLibrary {
  const [items, setItems] = useState<RecipeListItem[]>([]);
  const [activeSession, setActiveSession] = useState<CookSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.recipes.list.query({}), api.cook.getActive.query()])
      .then(([rows, session]) => {
        if (active) {
          setItems(rows);
          setActiveSession(session);
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

  return { items, activeSession, loading, error };
}
