import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFavorite } from './useFavorite';

const mutate = vi.fn();
vi.mock('../../lib/api', () => ({
  api: { recipes: { setFavorite: { mutate: (input: unknown): Promise<unknown> => mutate(input) as Promise<unknown> } } },
}));

describe('useFavorite (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutate.mockResolvedValue({ favorited: true });
  });

  it('seeds from the initial flag and persists an optimistic flip', async () => {
    const { result } = renderHook(() => useFavorite('r1', false));
    expect(result.current.favorited).toBe(false);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.favorited).toBe(true);
    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ recipeId: 'r1', favorited: true });
    });
  });

  it('reverts when the mutation rejects', async () => {
    mutate.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useFavorite('r1', false));
    act(() => {
      result.current.toggle();
    });
    expect(result.current.favorited).toBe(true);
    await waitFor(() => {
      expect(result.current.favorited).toBe(false);
    });
  });
});
