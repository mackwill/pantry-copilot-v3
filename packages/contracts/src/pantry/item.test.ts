import { describe, expect, it } from 'vitest';
import { createPantryItemInput, PANTRY_CATEGORIES, PANTRY_LOCATIONS, PANTRY_UNITS, pantryCategorySchema, pantryItemSchema, updatePantryItemInput } from '../index';

describe('pantry enums', () => {
  it('exposes the 7 board categories', () => {
    expect(PANTRY_CATEGORIES).toEqual(['produce', 'dairy', 'pantry', 'protein', 'freezer', 'drinks', 'treats']);
  });
  it('exposes the 7 board locations', () => {
    expect(PANTRY_LOCATIONS).toContain('fridge_top');
    expect(PANTRY_LOCATIONS).toHaveLength(7);
  });
  it('rejects an unknown category', () => {
    expect(pantryCategorySchema.safeParse('vegetables').success).toBe(false);
    expect(pantryCategorySchema.safeParse('dairy').success).toBe(true);
  });
  it('exposes units including gallon and bunch', () => {
    expect(PANTRY_UNITS).toContain('gallon');
    expect(PANTRY_UNITS).toContain('bunch');
  });
});

describe('pantry item DTOs', () => {
  const valid = {
    name: 'Whole milk', brand: 'Strauss', quantity: 0.5, unit: 'gallon',
    category: 'dairy', location: 'fridge_top',
    purchasedAt: '2026-04-16', bestBy: '2026-04-23', notes: null,
  };
  it('accepts a valid create input', () => {
    expect(createPantryItemInput.safeParse(valid).success).toBe(true);
  });
  it('requires a non-empty name', () => {
    expect(createPantryItemInput.safeParse({ ...valid, name: '' }).success).toBe(false);
  });
  it('rejects negative quantity', () => {
    expect(createPantryItemInput.safeParse({ ...valid, quantity: -1 }).success).toBe(false);
  });
  it('update input requires an id and allows partial fields', () => {
    expect(updatePantryItemInput.safeParse({ id: crypto.randomUUID(), name: 'Skim milk' }).success).toBe(true);
    expect(updatePantryItemInput.safeParse({ name: 'Skim milk' }).success).toBe(false);
  });
  it('full item schema includes server fields', () => {
    const item = { ...valid, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    expect(pantryItemSchema.safeParse(item).success).toBe(true);
  });
});
