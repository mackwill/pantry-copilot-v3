import type { AIGenerationRequest, AIRecipe, GenerationEvent } from '@pantry/contracts';
import { describe, expect, it } from 'vitest';
import { computePullingFromSplit, type RawProviderEvent, runRecipeStream } from './stream-orchestrator.js';

const REQ: AIGenerationRequest = {
  prompt: 'something green',
  weirdness: 40,
  pantry: [
    { name: 'Spinach', quantity: 2, unit: 'cup', expiresInDays: 2 },
    { name: 'Rice', quantity: 1, unit: 'bag', expiresInDays: 90 },
  ],
  mustInclude: [],
};

const RECIPE: AIRecipe = {
  title: 'Skillet greens',
  summary: 'Fast wilt of greens.',
  weirdnessScore: 40,
  ingredients: [{ name: 'Spinach', quantity: 2, unit: 'cup', optional: false, note: null }],
  steps: [{ text: 'Wilt the spinach.' }],
  timeMinutes: 10,
  difficulty: 'easy',
  substitutions: [],
  pantryItemsUsed: ['Spinach'],
  confidence: 0.8,
  caveats: [],
  whySuggested: 'Uses expiring spinach.',
  observation: 'Your spinach is about to turn.',
};

function fakeRunner(events: RawProviderEvent[]) {
  return async function* (): AsyncIterable<RawProviderEvent> {
    await Promise.resolve();
    for (const e of events) yield e;
  };
}

async function collect(it: AsyncIterable<GenerationEvent>): Promise<GenerationEvent[]> {
  const out: GenerationEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

const HAPPY: RawProviderEvent[] = [
  { type: 'thinking_delta', text: 'Looking at the pantry...' },
  { type: 'tool_started', id: 't1', name: 'read_pantry', display: 'read_pantry()' },
  { type: 'tool_resolved', id: 't1', name: 'read_pantry', result: '2 items' },
  { type: 'emit_recipe_started', id: 'r1' },
  { type: 'recipe_fragment', fragment: JSON.stringify(RECIPE).slice(0, 30) },
  { type: 'recipe_fragment', fragment: JSON.stringify(RECIPE).slice(30) },
  { type: 'completed', recipe: RECIPE, tokensUsed: { input: 10, output: 20 } },
];

describe('computePullingFromSplit', () => {
  it('puts expiring (≤3d) and mustInclude items in must, the rest in maybe', () => {
    const split = computePullingFromSplit({ ...REQ, mustInclude: ['Garlic'] });
    expect(split.must).toContain('Spinach');
    expect(split.must).toContain('Garlic');
    expect(split.maybe).toContain('Rice');
  });
});

describe('runRecipeStream', () => {
  it('emits pulling_from first, then thinking/tool/recipe, ending in done', async () => {
    const events = await collect(runRecipeStream(REQ, fakeRunner(HAPPY), new AbortController().signal, { partialThrottleMs: 0 }));
    expect(events[0]?.type).toBe('pulling_from');
    const types = events.map((e) => e.type);
    expect(types).toContain('thinking_token');
    expect(types).toContain('tool_event');
    expect(types).toContain('recipe_partial');
    expect(types.at(-1)).toBe('done');
    const done = events.at(-1);
    expect(done?.type === 'done' && done.recipe.title).toBe('Skillet greens');
    expect(done?.type === 'done' && done.recipeId).toBeNull();
  });
  it('assigns monotonic seq and non-decreasing t', async () => {
    const events = await collect(runRecipeStream(REQ, fakeRunner(HAPPY), new AbortController().signal, { partialThrottleMs: 0 }));
    let prev = events[0];
    for (const e of events.slice(1)) {
      if (prev) {
        expect(e.seq).toBe(prev.seq + 1);
        expect(e.t).toBeGreaterThanOrEqual(prev.t);
      }
      prev = e;
    }
  });
  it('surfaces the recipe observation as a notice before done', async () => {
    const events = await collect(runRecipeStream(REQ, fakeRunner(HAPPY), new AbortController().signal, { partialThrottleMs: 0 }));
    const notice = events.find((e) => e.type === 'notice');
    expect(notice?.type === 'notice' && notice.text).toBe('Your spinach is about to turn.');
  });
  it('emits error/no_response when the provider never completes', async () => {
    const events = await collect(
      runRecipeStream(REQ, fakeRunner([{ type: 'thinking_delta', text: 'hm' }]), new AbortController().signal),
    );
    const last = events.at(-1);
    expect(last?.type === 'error' && last.code).toBe('no_response');
  });
  it('emits error/invalid_response when the completed recipe fails the schema', async () => {
    const bad = [{ type: 'completed', recipe: { title: '' } as unknown as AIRecipe, tokensUsed: { input: 0, output: 0 } }] as RawProviderEvent[];
    const events = await collect(runRecipeStream(REQ, fakeRunner(bad), new AbortController().signal));
    const last = events.at(-1);
    expect(last?.type === 'error' && last.code).toBe('invalid_response');
  });
  it('emits aborted when the signal is already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const events = await collect(runRecipeStream(REQ, fakeRunner(HAPPY), ctrl.signal));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('aborted');
  });
  it('stops and emits aborted when the signal fires mid-stream', async () => {
    const ctrl = new AbortController();
    const slow = async function* (): AsyncIterable<RawProviderEvent> {
      await Promise.resolve();
      yield { type: 'thinking_delta', text: 'one' };
      ctrl.abort();
      yield { type: 'thinking_delta', text: 'two' };
    };
    const events = await collect(runRecipeStream(REQ, slow, ctrl.signal));
    expect(events.at(-1)?.type).toBe('aborted');
    expect(events.some((e) => e.type === 'done')).toBe(false);
  });
});
