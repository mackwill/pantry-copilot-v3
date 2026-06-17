import type { AITweakRequest, RecipeTweakEvent } from '@pantry/contracts';
import { describe, expect, it } from 'vitest';
import { MOCK_TWEAK_RESPONSE } from './mock-tape.js';
import { type RawTweakEvent, runTweakStream } from './tweak-orchestrator.js';

const req: AITweakRequest = {
  recipe: MOCK_TWEAK_RESPONSE.updatedRecipe,
  prompt: 'lighter on the oil, more greens',
  priorTurns: [],
};

async function collect(it: AsyncIterable<RecipeTweakEvent>): Promise<RecipeTweakEvent[]> {
  const out: RecipeTweakEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

function tape(...events: RawTweakEvent[]): () => AsyncIterable<RawTweakEvent> {
  return async function* () {
    await Promise.resolve();
    for (const e of events) yield e;
  };
}

function fragments(response: unknown, chunks = 8): RawTweakEvent[] {
  const json = JSON.stringify(response);
  const size = Math.ceil(json.length / chunks);
  const out: RawTweakEvent[] = [];
  for (let i = 0; i < json.length; i += size) {
    out.push({ type: 'tweak_fragment', fragment: json.slice(i, i + size) });
  }
  return out;
}

const happyTape = tape(
  ...fragments(MOCK_TWEAK_RESPONSE),
  { type: 'completed', response: MOCK_TWEAK_RESPONSE, tokensUsed: { input: 0, output: 0 } },
);

describe('runTweakStream', () => {
  it('grows the summary, resolves the recipe, and ends on a valid tweak_done', async () => {
    const events = await collect(runTweakStream(req, happyTape, new AbortController().signal, { partialThrottleMs: 0 }));

    const summary = events
      .filter((e): e is Extract<RecipeTweakEvent, { type: 'tweak_summary' }> => e.type === 'tweak_summary')
      .map((e) => e.text)
      .join('');
    expect(summary).toBe(MOCK_TWEAK_RESPONSE.summary);

    expect(events.some((e) => e.type === 'tweak_recipe_partial')).toBe(true);

    const done = events.at(-1);
    expect(done?.type).toBe('tweak_done');
    if (done?.type === 'tweak_done') {
      expect(done.response.updatedRecipe.ingredients.some((i) => i.added)).toBe(true);
      expect(done.recipeId).toBeNull();
    }
  });

  it('stamps monotonic seq starting at zero', async () => {
    const events = await collect(runTweakStream(req, happyTape, new AbortController().signal, { partialThrottleMs: 0 }));
    expect(events.map((e) => e.seq)).toEqual(events.map((_e, i) => i));
  });

  it('yields aborted when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const events = await collect(runTweakStream(req, happyTape, controller.signal));
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('aborted');
  });

  it('emits error when the stream completes without a response', async () => {
    const events = await collect(
      runTweakStream(req, tape(...fragments(MOCK_TWEAK_RESPONSE)), new AbortController().signal, { partialThrottleMs: 0 }),
    );
    const last = events.at(-1);
    expect(last?.type === 'error' && last.code).toBe('no_response');
  });

  it('emits error when the provider runner throws', async () => {
    const boom = (): AsyncIterable<RawTweakEvent> => {
      throw new Error('provider exploded');
    };
    const events = await collect(runTweakStream(req, boom, new AbortController().signal));
    const last = events.at(-1);
    expect(last?.type === 'error' && last.code).toBe('provider_error');
  });
});
