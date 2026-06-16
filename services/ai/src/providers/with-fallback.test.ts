import type { AIGenerationRequest, AIImageExtractionResponse, AIProviderName, GenerationEvent } from '@pantry/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { AIProvider } from './types.js';
import { withFallback } from './with-fallback.js';

interface ProviderStubs {
  extract?: () => Promise<AIImageExtractionResponse>;
  stream?: (req: AIGenerationRequest, signal: AbortSignal) => AsyncIterable<GenerationEvent>;
}

function provider(name: AIProviderName, stubs: ProviderStubs = {}): AIProvider {
  return {
    name,
    generateStructured: () => Promise.reject(new Error(`${name} generateStructured`)),
    streamStructured: stubs.stream ?? (() => { throw new Error(`${name} stream`); }),
    extractFromImage: stubs.extract ?? (() => Promise.resolve(okResponse(name))),
  };
}

function eventStream(...events: GenerationEvent[]): () => AsyncIterable<GenerationEvent> {
  return async function* () {
    await Promise.resolve();
    for (const e of events) yield e;
  };
}

async function collect(it: AsyncIterable<GenerationEvent>): Promise<GenerationEvent[]> {
  const out: GenerationEvent[] = [];
  for await (const e of it) out.push(e);
  return out;
}

const okResponse = (name: AIProviderName): AIImageExtractionResponse => ({
  provider: name,
  model: `${name}-model`,
  result: { ingredients: [], duplicatesMerged: [], reviewNotes: null },
  tokensUsed: { input: 1, output: 1 },
});

const request = { imageBase64: 'aGVsbG8=', mediaType: 'image/jpeg' } as const;

describe('withFallback', () => {
  it('returns the primary result when the primary succeeds', async () => {
    const composed = withFallback(provider('anthropic'), provider('openai'));
    const res = await composed.extractFromImage(request);
    expect(res.provider).toBe('anthropic');
  });

  it('falls back to the secondary when the primary throws', async () => {
    const onError = vi.fn();
    const primary = provider('anthropic', { extract: () => Promise.reject(new Error('primary down')) });
    const composed = withFallback(primary, provider('openai'), onError);
    const res = await composed.extractFromImage(request);
    expect(res.provider).toBe('openai');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('throws a structured error when both providers fail', async () => {
    const primary = provider('anthropic', { extract: () => Promise.reject(new Error('primary down')) });
    const fallback = provider('openai', { extract: () => Promise.reject(new Error('fallback down')) });
    const composed = withFallback(primary, fallback);
    await expect(composed.extractFromImage(request)).rejects.toThrow(/anthropic.*openai/s);
  });

  it('reports the primary provider name', () => {
    expect(withFallback(provider('anthropic'), provider('openai')).name).toBe('anthropic');
  });

  it('falls back to the secondary stream when the primary throws before yielding', async () => {
    const onError = vi.fn();
    const req: AIGenerationRequest = { prompt: 'x', weirdness: 10, pantry: [], mustInclude: [] };
    const done: GenerationEvent = {
      type: 'done',
      recipe: {
        title: 'Soup',
        summary: 's',
        weirdnessScore: 10,
        ingredients: [{ name: 'Water', quantity: null, unit: null, optional: false, note: null }],
        steps: [{ text: 'Boil' }],
        timeMinutes: 5,
        difficulty: 'easy',
        substitutions: [],
        pantryItemsUsed: [],
        confidence: 0.7,
        caveats: [],
        whySuggested: 'why',
        observation: null,
      },
      recipeId: null,
      seq: 0,
      t: 0,
    };
    const primary = provider('anthropic', { stream: () => { throw new Error('stream boom'); } });
    const fallback = provider('openai', { stream: eventStream(done) });
    const composed = withFallback(primary, fallback, onError);
    const events = await collect(composed.streamStructured(req, new AbortController().signal));
    expect(events.at(-1)?.type).toBe('done');
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
