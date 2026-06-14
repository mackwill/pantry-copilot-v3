import { describe, expect, it } from 'vitest';
import { mockProvider } from './mock.js';

const request = { imageBase64: 'aGVsbG8=', mediaType: 'image/jpeg' } as const;

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
