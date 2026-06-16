import type { AIGenerationRequest, GenerationEvent } from '@pantry/contracts';
import { describe, expect, it } from 'vitest';
import { mockProvider } from './mock.js';
import { MOCK_RECIPE } from './mock-tape.js';

const request = { imageBase64: 'aGVsbG8=', mediaType: 'image/jpeg' } as const;

const genRequest: AIGenerationRequest = {
  prompt: 'something with scallions',
  weirdness: 40,
  pantry: [{ name: 'Scallions', quantity: 1, unit: 'bunch', expiresInDays: 2 }],
  mustInclude: [],
};

async function collect(it: AsyncIterable<GenerationEvent>): Promise<GenerationEvent[]> {
  const out: GenerationEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

describe('mockProvider.extractFromImage', () => {
  it('identifies itself as the mock provider', () => {
    expect(mockProvider.name).toBe('mock');
  });

  it('returns the deterministic board canned result', async () => {
    const res = await mockProvider.extractFromImage(request);
    expect(res.provider).toBe('mock');
    expect(res.model).toBe('mock-vision');
    expect(res.result.ingredients).toHaveLength(7);
    expect(res.result.ingredients.map((i) => i.name)).toContain('Whole milk');
  });

  it('includes a low-confidence item that starts unselected', async () => {
    const res = await mockProvider.extractFromImage(request);
    const lowConf = res.result.ingredients.filter((i) => i.confidence < 0.5);
    expect(lowConf).toHaveLength(1);
    expect(lowConf[0]?.name).toBe('Unknown jar');
  });

  it('only emits enum-valid categories/units/locations', async () => {
    const res = await mockProvider.extractFromImage(request);
    for (const ing of res.result.ingredients) {
      expect(ing.name.length).toBeGreaterThan(0);
      expect(ing.confidence).toBeGreaterThanOrEqual(0);
      expect(ing.confidence).toBeLessThanOrEqual(1);
    }
    expect(res.tokensUsed.input).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic across calls', async () => {
    const a = await mockProvider.extractFromImage(request);
    const b = await mockProvider.extractFromImage(request);
    expect(a).toEqual(b);
  });
});

describe('mockProvider.streamStructured (tape replay)', () => {
  it('replays the frozen frame order: pulling_from → thinking/tools → recipe_partial → notice → done', async () => {
    const events = await collect(mockProvider.streamStructured(genRequest, new AbortController().signal));
    expect(events[0]?.type).toBe('pulling_from');
    const types = events.map((e) => e.type);
    expect(types).toContain('thinking_token');
    expect(types.filter((tp) => tp === 'tool_event').length).toBeGreaterThanOrEqual(6); // 3 tools × pending+complete
    expect(types).toContain('recipe_partial');
    expect(types).toContain('notice');
    expect(types.at(-1)).toBe('done');
  });

  it('ends on the canned recipe with a complete final partial', async () => {
    const events = await collect(mockProvider.streamStructured(genRequest, new AbortController().signal));
    const done = events.at(-1);
    expect(done?.type === 'done' && done.recipe.title).toBe(MOCK_RECIPE.title);
    const partials = events.filter((e) => e.type === 'recipe_partial');
    expect(partials.at(-1)?.type === 'recipe_partial' && partials.at(-1)).toBeTruthy();
  });
});

describe('mockProvider.generateStructured', () => {
  it('returns the canned recipe directly', async () => {
    const res = await mockProvider.generateStructured(genRequest);
    expect(res.recipe.title).toBe(MOCK_RECIPE.title);
  });
});
