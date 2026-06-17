import type { AIRecipe, RecipeDetail, RecipeTweakEvent, RecipeTweakRequest } from '@pantry/contracts';
import {
  beginTweakTurn,
  initialTweakState,
  reduceTweakEvent,
  type TweakChatState,
  type TweakThreadTurn,
} from '@pantry/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

export interface UseRecipeChatInit {
  recipe: AIRecipe;
  recipeId: string;
  version: number;
  turns: TweakThreadTurn[];
}

export interface TweakHandlers {
  onData: (event: RecipeTweakEvent) => void;
  onError: (err: unknown) => void;
  onComplete: () => void;
}

export interface TweakSubscription {
  unsubscribe: () => void;
}

/** Injectable so tests drive scripted frames without a live subscription. */
export type TweakSubscribe = (input: RecipeTweakRequest, handlers: TweakHandlers) => TweakSubscription;
export type RevertFn = (recipeId: string) => Promise<RecipeDetail>;

const defaultSubscribe: TweakSubscribe = (input, handlers) =>
  api.recipes.tweakStream.subscribe(input, {
    onData: handlers.onData,
    onError: handlers.onError,
    onComplete: handlers.onComplete,
  });

const defaultRevert: RevertFn = (recipeId) => api.recipes.revert.mutate({ recipeId });

export interface UseRecipeChat extends TweakChatState {
  isStreaming: boolean;
  /** Send a tweak prompt; opens an optimistic turn and streams the result. */
  send: (prompt: string) => void;
  /** Restore the recipe to its pre-tweak snapshot and clear the thread. */
  revert: () => void;
}

/**
 * Consumes `recipes.tweakStream` and reduces the event tape (via the shared
 * `@pantry/utils` reducer) into the chat state the §✦ panel + live doc render.
 * The subscription + revert are injectable for tests.
 */
export function useRecipeChat(init: UseRecipeChatInit, options?: { subscribe?: TweakSubscribe; revert?: RevertFn }): UseRecipeChat {
  const subscribe = options?.subscribe ?? defaultSubscribe;
  const revertFn = options?.revert ?? defaultRevert;
  const [state, setState] = useState<TweakChatState>(() =>
    initialTweakState({ recipe: init.recipe, recipeId: init.recipeId, version: init.version, turns: init.turns }),
  );
  const subRef = useRef<TweakSubscription | null>(null);

  const send = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (trimmed.length === 0) return;
      subRef.current?.unsubscribe();
      setState((prev) => beginTweakTurn(prev, trimmed));
      subRef.current = subscribe(
        { recipeId: init.recipeId, prompt: trimmed },
        {
          onData: (event) => {
            setState((prev) => reduceTweakEvent(prev, event));
          },
          onError: (err) => {
            const message = err instanceof Error ? err.message : String(err);
            setState((prev) => ({ ...prev, status: 'error', streamingSummary: '', error: { code: 'stream_error', message } }));
          },
          onComplete: () => {},
        },
      );
    },
    [subscribe, init.recipeId],
  );

  const revert = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    void revertFn(init.recipeId)
      .then((detail) => {
        setState(initialTweakState({ recipe: detail, recipeId: detail.id, version: detail.version, turns: [] }));
      })
      .catch(() => undefined);
  }, [revertFn, init.recipeId]);

  useEffect(
    () => () => {
      subRef.current?.unsubscribe();
    },
    [],
  );

  return { ...state, isStreaming: state.status === 'streaming', send, revert };
}
