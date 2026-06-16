import type { GenerationEvent, GenerationRequest } from '@pantry/contracts';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Avoid loading the native api client (auth-client → expo-secure-store) under vitest;
// the hook's subscription is injected by these tests.
vi.mock('../../lib/api', () => ({
  api: { recipes: { generateStream: { subscribe: vi.fn() } } },
}));

import { type GenerationSubscribe, useGeneration } from './useGeneration';

const baseInput: GenerationRequest = { prompt: 'something with scallions', pantryItemIds: [], weirdness: 40 };

/** Controllable fake subscription: capture the handlers so the test drives frames. */
function makeFakeSubscribe() {
  const inputs: GenerationRequest[] = [];
  const unsubscribe = vi.fn();
  let onData: (event: GenerationEvent) => void = () => {};
  let onError: (err: unknown) => void = () => {};
  const subscribe: GenerationSubscribe = (input, handlers) => {
    inputs.push(input);
    onData = handlers.onData;
    onError = handlers.onError;
    return { unsubscribe };
  };
  return {
    subscribe,
    inputs,
    unsubscribe,
    emit: (event: GenerationEvent) => { act(() => { onData(event); }); },
    fail: (err: unknown) => { act(() => { onError(err); }); },
  };
}

const ev = {
  pulling: { type: 'pulling_from', must: ['Scallions'], maybe: ['Carrots'], seq: 0, t: 0 },
  think1: { type: 'thinking_token', text: 'Let me look ', seq: 1, t: 10 },
  think2: { type: 'thinking_token', text: 'at the pantry.', seq: 2, t: 20 },
  toolPending: { type: 'tool_event', id: 'tool-read', name: 'read_pantry', state: 'pending', display: 'read_pantry()', result: null, seq: 3, t: 25 },
  toolDone: { type: 'tool_event', id: 'tool-read', name: 'read_pantry', state: 'complete', display: 'read_pantry()', result: '14 items', seq: 4, t: 30 },
  partial: { type: 'recipe_partial', recipe: { title: 'Fried Rice' }, complete: false, seq: 5, t: 3400 },
  notice: { type: 'notice', text: 'Your scallions are on their way out.', seq: 6, t: 3500 },
  done: {
    type: 'done',
    recipe: {
      title: 'Charred Scallion & Carrot Fried Rice',
      summary: 's',
      weirdnessScore: 40,
      ingredients: [{ name: 'Rice', quantity: 3, unit: 'cup', optional: false, note: null }],
      steps: [{ text: 'Cook it' }],
      timeMinutes: 20,
      difficulty: 'easy',
      substitutions: [],
      pantryItemsUsed: [],
      confidence: 0.8,
      caveats: [],
      whySuggested: 'why',
      observation: null,
    },
    recipeId: 'a151a2bf-3bb5-45e9-9d11-11b3be8b7c3b',
    seq: 7,
    t: 3600,
  },
  error: { type: 'error', code: 'no_response', message: 'nothing came back', seq: 8, t: 100 },
} satisfies Record<string, GenerationEvent>;

describe('useGeneration (mobile)', () => {
  it('starts in idle, flips to thinking on start', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    expect(result.current.status).toBe('idle');
    act(() => {
      result.current.start(baseInput);
    });
    expect(result.current.status).toBe('thinking');
    expect(fake.inputs).toEqual([baseInput]);
  });

  it('accumulates thinking prose and the pantry split', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.pulling);
    fake.emit(ev.think1);
    fake.emit(ev.think2);
    expect(result.current.prose).toBe('Let me look at the pantry.');
    expect(result.current.pulling).toEqual({ must: ['Scallions'], maybe: ['Carrots'] });
  });

  it('interleaves prose and tool calls in arrival order in the transcript', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.think1);
    fake.emit(ev.toolPending);
    fake.emit(ev.toolDone);
    fake.emit(ev.think2);
    const kinds = result.current.transcript.map((e) => e.kind);
    expect(kinds).toEqual(['prose', 'tool', 'prose']);
    const first = result.current.transcript[0];
    const second = result.current.transcript[1];
    expect(first.kind === 'prose' && first.text).toBe('Let me look ');
    expect(second.kind === 'tool' && second.tool.state).toBe('complete');
  });

  it('upserts a tool event in place by id (pending → complete)', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.toolPending);
    fake.emit(ev.toolDone);
    expect(result.current.tools).toHaveLength(1);
    expect(result.current.tools[0]?.state).toBe('complete');
    expect(result.current.tools[0]?.result).toBe('14 items');
  });

  it('transitions to drafting on the first recipe_partial and records thinking time', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.partial);
    expect(result.current.status).toBe('drafting');
    expect(result.current.recipe?.title).toBe('Fried Rice');
    expect(result.current.thinkingMs).toBe(3400);
  });

  it('finishes at result with the full recipe + persisted id, and surfaces the notice', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.partial);
    fake.emit(ev.notice);
    fake.emit(ev.done);
    expect(result.current.status).toBe('result');
    expect(result.current.recipe?.title).toBe('Charred Scallion & Carrot Fried Rice');
    expect(result.current.recipeId).toBe('a151a2bf-3bb5-45e9-9d11-11b3be8b7c3b');
    expect(result.current.notice).toBe('Your scallions are on their way out.');
  });

  it('enters the error state on an error frame', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.error);
    expect(result.current.status).toBe('error');
    expect(result.current.error).toEqual({ code: 'no_response', message: 'nothing came back' });
  });

  it('enters the error state when the subscription itself errors', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.fail(new Error('socket closed'));
    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toContain('socket closed');
  });

  it('stop() unsubscribes and marks the run aborted mid-stream', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.think1);
    act(() => { result.current.stop(); });
    expect(fake.unsubscribe).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('aborted');
  });

  it('stop() after a result keeps the result (no spurious abort)', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.done);
    act(() => { result.current.stop(); });
    expect(result.current.status).toBe('result');
  });

  it('branch() builds a new request via buildBranchInput and re-runs (weirder bumps weirdness)', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.done);
    act(() => { result.current.branch('weirder'); });
    expect(fake.inputs).toHaveLength(2);
    expect(fake.inputs[1].weirdness).toBe(60);
    expect(fake.inputs[1].prompt).toContain('weirder');
    expect(result.current.status).toBe('thinking');
  });

  it('start() resets prior state', () => {
    const fake = makeFakeSubscribe();
    const { result } = renderHook(() => useGeneration({ subscribe: fake.subscribe }));
    act(() => { result.current.start(baseInput); });
    fake.emit(ev.think1);
    fake.emit(ev.done);
    act(() => { result.current.start(baseInput); });
    expect(result.current.prose).toBe('');
    expect(result.current.recipe).toBeNull();
    expect(result.current.status).toBe('thinking');
  });
});
