import { z } from 'zod';

export const PANTRY_CATEGORIES = ['produce', 'dairy', 'pantry', 'protein', 'freezer', 'drinks', 'treats'] as const;
export const PANTRY_LOCATIONS = [
  'fridge_top', 'fridge_door', 'fridge_crisper', 'freezer', 'pantry_upper', 'pantry_lower', 'counter',
] as const;
export const PANTRY_UNITS = [
  'ea', 'g', 'kg', 'lb', 'oz', 'cup', 'tbsp', 'tsp',
  'gallon', 'stick', 'pack', 'jar', 'tin', 'bottle', 'bunch', 'head', 'bag',
] as const;
export const FRESHNESS_TONES = ['success', 'warning', 'danger'] as const;
export const INVENTORY_EVENT_KINDS = ['added', 'edited', 'removed', 'adjusted'] as const;

export const pantryCategorySchema = z.enum(PANTRY_CATEGORIES);
export const pantryLocationSchema = z.enum(PANTRY_LOCATIONS);
export const pantryUnitSchema = z.enum(PANTRY_UNITS);
export const freshnessToneSchema = z.enum(FRESHNESS_TONES);
export const inventoryEventKindSchema = z.enum(INVENTORY_EVENT_KINDS);

export type PantryCategory = z.infer<typeof pantryCategorySchema>;
export type PantryLocation = z.infer<typeof pantryLocationSchema>;
export type PantryUnit = z.infer<typeof pantryUnitSchema>;
export type FreshnessTone = z.infer<typeof freshnessToneSchema>;
export type InventoryEventKind = z.infer<typeof inventoryEventKindSchema>;
