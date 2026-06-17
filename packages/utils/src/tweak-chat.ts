import type { AIRecipePartial, RecipeChange, RecipeChangeTag, RecipeTweakEvent } from '@pantry/contracts';

export type TweakChatStatus = 'idle' | 'streaming' | 'done' | 'error' | 'aborted';

/** A turn in the chat thread (rendered: user bubble + AI summary + chips). */
export interface TweakThreadTurn {
  turn: number;
  userMessage: string;
  summary: string;
  changes: RecipeChange[];
}

export interface TweakChatState {
  status: TweakChatStatus;
  /** The live recipe — full at rest, partial mid-stream. Drives the doc. */
  recipe: AIRecipePartial | null;
  recipeId: string | null;
  version: number;
  /** Completed turns, oldest first. */
  turns: TweakThreadTurn[];
  /** The in-flight turn's user message (optimistic bubble), or null. */
  pendingUserMessage: string | null;
  /** Summary prose accumulating for the in-flight turn. */
  streamingSummary: string;
  error: { code: string; message: string } | null;
}

export interface InitialTweakStateArgs {
  recipe: AIRecipePartial | null;
  recipeId: string | null;
  version: number;
  turns: TweakThreadTurn[];
}

/** Seed state from a loaded recipe + its hydrated tweak thread. Also the
 *  reset target after a revert (pass the restored recipe + empty turns). */
export function initialTweakState(args: InitialTweakStateArgs): TweakChatState {
  return {
    status: 'idle',
    recipe: args.recipe,
    recipeId: args.recipeId,
    version: args.version,
    turns: args.turns,
    pendingUserMessage: null,
    streamingSummary: '',
    error: null,
  };
}

/** Optimistically open a turn: show the user's message, clear prior stream state. */
export function beginTweakTurn(state: TweakChatState, userMessage: string): TweakChatState {
  return { ...state, status: 'streaming', pendingUserMessage: userMessage, streamingSummary: '', error: null };
}

/**
 * Reduce a tweak wire event into chat state. Pure — every branch returns a
 * fresh object. The live `recipe` updates in place from the partials and the
 * final `tweak_done`, so the doc re-renders as the co-pilot edits it.
 */
export function reduceTweakEvent(state: TweakChatState, event: RecipeTweakEvent): TweakChatState {
  switch (event.type) {
    case 'tweak_summary':
      return { ...state, status: 'streaming', streamingSummary: state.streamingSummary + event.text };
    case 'tweak_recipe_partial':
      return { ...state, status: 'streaming', recipe: event.recipe };
    case 'tweak_done': {
      const turn: TweakThreadTurn = {
        turn: event.turn,
        userMessage: state.pendingUserMessage ?? '',
        summary: event.response.summary,
        changes: event.response.changes,
      };
      return {
        ...state,
        status: 'done',
        recipe: event.response.updatedRecipe,
        recipeId: event.recipeId ?? state.recipeId,
        version: event.version,
        turns: [...state.turns, turn],
        pendingUserMessage: null,
        streamingSummary: '',
      };
    }
    case 'error':
      return { ...state, status: 'error', streamingSummary: '', error: { code: event.code, message: event.message } };
    case 'aborted':
      return { ...state, status: 'aborted', pendingUserMessage: null, streamingSummary: '' };
  }
}

/**
 * Pill tone for a change chip. Shared so web + mobile render the board's
 * tag→tone map identically (both Pill components accept these tones).
 */
export function changeChipTone(tag: RecipeChangeTag): 'warning' | 'accent' | 'danger' | 'neutral' {
  switch (tag) {
    case 'change':
      return 'warning';
    case 'add':
      return 'accent';
    case 'remove':
      return 'danger';
    case 'note':
      return 'neutral';
  }
}
