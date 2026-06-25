import { isLimitReachedError } from '@pantry/api-client';
import type { AIRecipePartial, BranchAction, GenerationEvent, GenerationRequest, ToolEvent } from '@pantry/contracts';
import { buildBranchInput } from '@pantry/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';

export type GenerationStatus = 'idle' | 'thinking' | 'drafting' | 'result' | 'error' | 'aborted';

/** Ordered thinking-beat entry — prose and tool calls interleave by arrival. */
export type TranscriptEntry = { kind: 'prose'; text: string } | { kind: 'tool'; tool: ToolEvent };

export interface GenerationState {
  status: GenerationStatus;
  /** The pantry split the server opened the stream with. */
  pulling: { must: string[]; maybe: string[] } | null;
  /** Concatenated reasoning prose (thinking beat). */
  prose: string;
  /** Tool calls, deduped/upserted by id in first-seen order. */
  tools: ToolEvent[];
  /** Prose + tool calls in arrival order — drives the §04 interleaved stream. */
  transcript: TranscriptEntry[];
  /** Latest recipe snapshot — partial mid-stream, full once `done` lands. */
  recipe: AIRecipePartial | null;
  /** Persisted recipe id, present once the API has written the row. */
  recipeId: string | null;
  /** The single surfaced observation, if any. */
  notice: string | null;
  error: { code: string; message: string } | null;
  /** True when the last stream failed the weekly quota — opens the limit-hit sheet. */
  limitReached: boolean;
  /** ms the thinking beat ran before drafting began (drives the collapsed summary). */
  thinkingMs: number;
}

const INITIAL: GenerationState = {
  status: 'idle',
  pulling: null,
  prose: '',
  tools: [],
  transcript: [],
  recipe: null,
  recipeId: null,
  notice: null,
  error: null,
  limitReached: false,
  thinkingMs: 0,
};

/** Reduce a wire event into render state. Pure — every branch returns a fresh object. */
function reduce(state: GenerationState, event: GenerationEvent): GenerationState {
  switch (event.type) {
    case 'pulling_from':
      return { ...state, pulling: { must: event.must, maybe: event.maybe } };
    case 'thinking_token': {
      const last = state.transcript.at(-1);
      const transcript: TranscriptEntry[] =
        last?.kind === 'prose'
          ? [...state.transcript.slice(0, -1), { kind: 'prose', text: last.text + event.text }]
          : [...state.transcript, { kind: 'prose', text: event.text }];
      return { ...state, prose: state.prose + event.text, transcript };
    }
    case 'tool_event': {
      const seen = state.tools.some((tool) => tool.id === event.id);
      const tools = seen
        ? state.tools.map((tool) => (tool.id === event.id ? event : tool))
        : [...state.tools, event];
      const inTranscript = state.transcript.some((e) => e.kind === 'tool' && e.tool.id === event.id);
      const transcript: TranscriptEntry[] = inTranscript
        ? state.transcript.map((e) => (e.kind === 'tool' && e.tool.id === event.id ? { kind: 'tool', tool: event } : e))
        : [...state.transcript, { kind: 'tool', tool: event }];
      return { ...state, tools, transcript };
    }
    case 'recipe_partial':
      return {
        ...state,
        status: 'drafting',
        recipe: event.recipe,
        thinkingMs: state.status === 'thinking' ? event.t : state.thinkingMs,
      };
    case 'notice':
      return { ...state, notice: event.text };
    case 'done':
      return { ...state, status: 'result', recipe: event.recipe, recipeId: event.recipeId };
    case 'error':
      return {
        ...state,
        status: 'error',
        error: { code: event.code, message: event.message },
        limitReached: event.code === 'limit_reached',
      };
    case 'aborted':
      return { ...state, status: 'aborted' };
  }
}

export interface GenerationHandlers {
  onData: (event: GenerationEvent) => void;
  onError: (err: unknown) => void;
  onComplete: () => void;
}

export interface GenerationSubscription {
  unsubscribe: () => void;
}

/** Injectable so tests can drive scripted frames without a live subscription. */
export type GenerationSubscribe = (
  input: GenerationRequest,
  handlers: GenerationHandlers,
) => GenerationSubscription;

const defaultSubscribe: GenerationSubscribe = (input, handlers) =>
  api.recipes.generateStream.subscribe(input, {
    onData: handlers.onData,
    onError: handlers.onError,
    onComplete: handlers.onComplete,
  });

export interface UseGeneration extends GenerationState {
  isStreaming: boolean;
  /** Begin a generation; resets prior state. */
  start: (input: GenerationRequest) => void;
  /** Unsubscribe (tears down the chain) and mark the run aborted unless already terminal. */
  stop: () => void;
  /** One-tap re-prompt: transform the last request and re-run. */
  branch: (action: BranchAction) => void;
  /** Dismiss the limit-hit sheet without re-running. */
  dismissLimitReached: () => void;
}

/**
 * Consumes `recipes.generateStream` and reduces the event tape into the
 * phase machine the §04/§02 screens render. The subscription is injectable
 * for tests; production wires the real tRPC subscription (RN EventSource
 * ponyfill via the api-client).
 */
export function useGeneration(options?: { subscribe?: GenerationSubscribe }): UseGeneration {
  const subscribe = options?.subscribe ?? defaultSubscribe;
  const [state, setState] = useState<GenerationState>(INITIAL);
  const subRef = useRef<GenerationSubscription | null>(null);
  const lastInputRef = useRef<GenerationRequest | null>(null);

  const start = useCallback(
    (input: GenerationRequest) => {
      subRef.current?.unsubscribe();
      lastInputRef.current = input;
      setState({ ...INITIAL, status: 'thinking' });
      subRef.current = subscribe(input, {
        onData: (event) => {
          setState((prev) => reduce(prev, event));
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : String(err);
          const limitReached = isLimitReachedError(err);
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: { code: limitReached ? 'limit_reached' : 'stream_error', message },
            limitReached,
          }));
        },
        onComplete: () => {},
      });
    },
    [subscribe],
  );

  const stop = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    setState((prev) =>
      prev.status === 'result' || prev.status === 'error' ? prev : { ...prev, status: 'aborted' },
    );
  }, []);

  const branch = useCallback(
    (action: BranchAction) => {
      const base = lastInputRef.current;
      if (base === null) return;
      start(buildBranchInput(base, action));
    },
    [start],
  );

  const dismissLimitReached = useCallback(() => {
    setState((prev) => ({ ...prev, limitReached: false }));
  }, []);

  useEffect(
    () => () => {
      subRef.current?.unsubscribe();
    },
    [],
  );

  return {
    ...state,
    isStreaming: state.status === 'thinking' || state.status === 'drafting',
    start,
    stop,
    branch,
    dismissLimitReached,
  };
}
