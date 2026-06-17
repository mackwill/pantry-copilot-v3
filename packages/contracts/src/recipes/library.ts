import { z } from 'zod';
import { recipeDifficultySchema } from './enums';
import { recipeSchema } from './recipe';

/** Board filter pills → server filter. (Mobile shows All/Tonight/Saved/Cooked/Want-to-try;
 *  M5 implements the data-backed subset; the rest render disabled until M6 sessions.) */
export const RECIPE_LIBRARY_FILTERS = ['all', 'favorites', 'recent'] as const;
export const recipeLibraryFilterSchema = z.enum(RECIPE_LIBRARY_FILTERS);
export type RecipeLibraryFilter = z.infer<typeof recipeLibraryFilterSchema>;

export const recipeListQuerySchema = z.object({
  filter: recipeLibraryFilterSchema.default('all'),
  limit: z.number().int().min(1).max(100).default(50),
});
export type RecipeListQuery = z.infer<typeof recipeListQuerySchema>;

/** Compact row for the library list — derived from the row columns + `data` jsonb. */
export const recipeListItemSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  summary: z.string().nullable(),
  timeMinutes: z.number().int().min(1),
  difficulty: recipeDifficultySchema,
  weirdness: z.number().int().min(0).max(100),
  pantryItemsUsed: z.array(z.string()),
  favorited: z.boolean(),
  createdAt: z.string(),
});
export type RecipeListItem = z.infer<typeof recipeListItemSchema>;

/**
 * Full detail DTO — the persisted recipe plus this user's favorite flag and
 * its tweak lineage. `version` is 1 for an untweaked recipe and increments
 * per applied tweak; `tweakCount` is the number of persisted tweak turns
 * (the board's `v3 · 2 tweaks` pill).
 */
export const recipeDetailSchema = recipeSchema.extend({
  favorited: z.boolean(),
  version: z.number().int().positive(),
  tweakCount: z.number().int().nonnegative(),
});
export type RecipeDetail = z.infer<typeof recipeDetailSchema>;

export const setFavoriteInputSchema = z.object({ recipeId: z.uuid(), favorited: z.boolean() });
export type SetFavoriteInput = z.infer<typeof setFavoriteInputSchema>;

export const recipeByIdInputSchema = z.object({ recipeId: z.uuid() });
export type RecipeByIdInput = z.infer<typeof recipeByIdInputSchema>;
