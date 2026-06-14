import { describe, expect, it } from 'vitest';
import {
  aiImageExtractionRequestSchema,
  aiImageExtractionResponseSchema,
  confirmScanInput,
  extractedIngredientSchema,
  imageScanResultSchema,
  imageScanSchema,
  SCAN_MEDIA_TYPES,
  SCAN_STATUSES,
} from '../index';

describe('SCAN_MEDIA_TYPES / SCAN_STATUSES', () => {
  it('exposes the accepted scan media types', () => {
    expect(SCAN_MEDIA_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });
  it('exposes the image_scans status lifecycle', () => {
    expect(SCAN_STATUSES).toEqual(['processing', 'succeeded', 'failed', 'confirmed']);
  });
});

describe('aiImageExtractionRequestSchema', () => {
  it('accepts a valid request with optional hint', () => {
    const parsed = aiImageExtractionRequestSchema.parse({
      imageBase64: 'aGVsbG8=',
      mediaType: 'image/jpeg',
      hint: 'open fridge',
    });
    expect(parsed.mediaType).toBe('image/jpeg');
    expect(parsed.hint).toBe('open fridge');
  });
  it('accepts a request without a hint', () => {
    const parsed = aiImageExtractionRequestSchema.parse({
      imageBase64: 'aGVsbG8=',
      mediaType: 'image/png',
    });
    expect(parsed.hint).toBeUndefined();
  });
  it('rejects an unsupported media type', () => {
    expect(
      aiImageExtractionRequestSchema.safeParse({ imageBase64: 'aGVsbG8=', mediaType: 'image/gif' }).success,
    ).toBe(false);
  });
  it('rejects an empty image payload', () => {
    expect(
      aiImageExtractionRequestSchema.safeParse({ imageBase64: '', mediaType: 'image/jpeg' }).success,
    ).toBe(false);
  });
});

describe('extractedIngredientSchema (defensive coercion)', () => {
  it('coerces an out-of-enum category/unit to null instead of throwing', () => {
    const parsed = extractedIngredientSchema.parse({
      name: 'Mystery jar',
      normalizedName: 'mystery jar',
      category: 'condiments',
      location: 'garage',
      quantity: 1,
      unit: 'litre',
      confidence: 0.3,
      notes: null,
    });
    expect(parsed.category).toBeNull();
    expect(parsed.location).toBeNull();
    expect(parsed.unit).toBeNull();
    expect(parsed.confidence).toBe(0.3);
  });
  it('keeps valid enum values', () => {
    const parsed = extractedIngredientSchema.parse({
      name: 'Whole milk',
      normalizedName: 'whole milk',
      category: 'dairy',
      location: 'fridge_door',
      quantity: 1,
      unit: 'gallon',
      confidence: 0.9,
      notes: null,
    });
    expect(parsed.category).toBe('dairy');
    expect(parsed.unit).toBe('gallon');
  });
  it('coerces an out-of-range confidence to a safe fallback', () => {
    const parsed = extractedIngredientSchema.parse({
      name: 'Butter',
      normalizedName: 'butter',
      category: 'dairy',
      location: 'fridge_top',
      quantity: 1,
      unit: 'stick',
      confidence: 5,
      notes: null,
    });
    expect(parsed.confidence).toBe(0.5);
  });
});

describe('imageScanResultSchema', () => {
  it('drops malformed ingredients but keeps valid ones', () => {
    const parsed = imageScanResultSchema.parse({
      ingredients: [
        { name: 'Carrots', normalizedName: 'carrots', category: 'produce', location: 'fridge_crisper', quantity: 6, unit: 'ea', confidence: 0.8, notes: null },
        { normalizedName: 'no name here' },
      ],
      duplicatesMerged: [],
      reviewNotes: null,
    });
    expect(parsed.ingredients).toHaveLength(1);
    expect(parsed.ingredients[0]?.name).toBe('Carrots');
  });
});

describe('aiImageExtractionResponseSchema', () => {
  it('validates a full provider response', () => {
    const parsed = aiImageExtractionResponseSchema.parse({
      provider: 'mock',
      model: 'mock-vision',
      result: { ingredients: [], duplicatesMerged: [], reviewNotes: null },
      tokensUsed: { input: 10, output: 20 },
    });
    expect(parsed.provider).toBe('mock');
    expect(parsed.tokensUsed.input).toBe(10);
  });
  it('rejects an unknown provider', () => {
    expect(
      aiImageExtractionResponseSchema.safeParse({
        provider: 'gemini',
        model: 'x',
        result: { ingredients: [], duplicatesMerged: [], reviewNotes: null },
        tokensUsed: { input: 0, output: 0 },
      }).success,
    ).toBe(false);
  });
});

describe('imageScanSchema (DTO)', () => {
  it('validates the client-facing scan record', () => {
    const parsed = imageScanSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'succeeded',
      result: { ingredients: [], duplicatesMerged: [], reviewNotes: null },
      createdAt: '2026-06-14T00:00:00.000Z',
    });
    expect(parsed.status).toBe('succeeded');
  });
});

describe('confirmScanInput', () => {
  it('requires a scanId and at least one item', () => {
    const ok = confirmScanInput.safeParse({
      scanId: '11111111-1111-4111-8111-111111111111',
      items: [
        { name: 'Milk', quantity: 1, unit: 'gallon', category: 'dairy', location: 'fridge_door' },
      ],
    });
    expect(ok.success).toBe(true);
  });
  it('rejects an empty item list', () => {
    expect(
      confirmScanInput.safeParse({ scanId: '11111111-1111-4111-8111-111111111111', items: [] }).success,
    ).toBe(false);
  });
  it('rejects a missing scanId', () => {
    expect(
      confirmScanInput.safeParse({ items: [{ name: 'Milk', quantity: 1, unit: 'gallon', category: 'dairy', location: 'fridge_door' }] }).success,
    ).toBe(false);
  });
});
