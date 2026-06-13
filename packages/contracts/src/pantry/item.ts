import { z } from 'zod';
import { pantryCategorySchema, pantryLocationSchema, pantryUnitSchema } from './enums';

// ISO date (YYYY-MM-DD) for purchasedAt/bestBy; null when not tracked.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const createPantryItemInput = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(120).nullable().default(null),
  quantity: z.number().nonnegative(),
  unit: pantryUnitSchema,
  category: pantryCategorySchema,
  location: pantryLocationSchema,
  purchasedAt: isoDate.nullable().default(null),
  bestBy: isoDate.nullable().default(null),
  notes: z.string().trim().max(2000).nullable().default(null),
});

export const updatePantryItemInput = createPantryItemInput.partial().extend({ id: z.uuid() });

export const pantryItemSchema = createPantryItemInput.extend({
  id: z.uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInput>;
export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInput>;
export type PantryItem = z.infer<typeof pantryItemSchema>;
