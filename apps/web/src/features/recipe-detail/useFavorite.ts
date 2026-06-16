import { useState } from 'react';
import { api } from '../../lib/api';

export interface UseFavorite {
  favorited: boolean;
  toggle: () => void;
}

/**
 * Optimistic favorite toggle. Flips local state immediately, persists via
 * `recipes.setFavorite`, and reverts if the mutation rejects.
 */
export function useFavorite(recipeId: string, initial: boolean): UseFavorite {
  const [favorited, setFavorited] = useState(initial);

  const toggle = (): void => {
    const next = !favorited;
    setFavorited(next);
    void api.recipes.setFavorite.mutate({ recipeId, favorited: next }).catch(() => {
      setFavorited(!next);
    });
  };

  return { favorited, toggle };
}
