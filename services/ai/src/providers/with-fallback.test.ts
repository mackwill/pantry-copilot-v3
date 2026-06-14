import type { AIImageExtractionResponse, AIProviderName } from '@pantry/contracts';
import { describe, expect, it, vi } from 'vitest';
import { type AIProvider, notImplementedUntilM4 } from './types.js';
import { withFallback } from './with-fallback.js';

function provider(name: AIProviderName, impl: () => Promise<AIImageExtractionResponse>): AIProvider {
  return {
    name,
    generateStructured: () => notImplementedUntilM4('generateStructured'),
    streamStructured: () => notImplementedUntilM4('streamStructured'),
    extractFromImage: impl,
  };
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
    const primary = provider('anthropic', () => Promise.resolve(okResponse('anthropic')));
    const fallback = provider('openai', () => Promise.resolve(okResponse('openai')));
    const composed = withFallback(primary, fallback);
    const res = await composed.extractFromImage(request);
    expect(res.provider).toBe('anthropic');
  });

  it('falls back to the secondary when the primary throws', async () => {
    const onError = vi.fn();
    const primary = provider('anthropic', () => Promise.reject(new Error('primary down')));
    const fallback = provider('openai', () => Promise.resolve(okResponse('openai')));
    const composed = withFallback(primary, fallback, onError);
    const res = await composed.extractFromImage(request);
    expect(res.provider).toBe('openai');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('throws a structured error when both providers fail', async () => {
    const primary = provider('anthropic', () => Promise.reject(new Error('primary down')));
    const fallback = provider('openai', () => Promise.reject(new Error('fallback down')));
    const composed = withFallback(primary, fallback);
    await expect(composed.extractFromImage(request)).rejects.toThrow(/anthropic.*openai/s);
  });

  it('reports the primary provider name', () => {
    const primary = provider('anthropic', () => Promise.resolve(okResponse('anthropic')));
    const fallback = provider('openai', () => Promise.resolve(okResponse('openai')));
    expect(withFallback(primary, fallback).name).toBe('anthropic');
  });
});
