import { z } from 'zod';
import { recipeDifficultySchema } from './enums';

/**
 * One recipe ingredient. Every field beyond `name` is defensively typed
 * (nullable + defaulted) so mid-stream partial snapshots never throw.
 */
export const recipeIngredientSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.number().nonnegative().nullable().default(null),
  unit: z.string().max(40).nullable().default(null),
  optional: z.boolean().default(false),
  note: z.string().max(200).nullable().default(null),
});
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

export const recipeSubstitutionSchema = z.object({
  ingredient: z.string().min(1).max(120),
  suggestion: z.string().min(1).max(200),
  reason: z.string().max(280).nullable().default(null),
});
export type RecipeSubstitution = z.infer<typeof recipeSubstitutionSchema>;

/** The recipe the model produces. Source of truth for the generation payload. */
export const aiRecipeSchema = z.object({
  title: z.string().min(1).max(160),
  summary: z.string().max(400),
  weirdnessScore: z.number().int().min(0).max(100),
  ingredients: z.array(recipeIngredientSchema).min(1),
  steps: z.array(z.string().min(1).max(1200)).min(1),
  timeMinutes: z
    .number()
    .int()
    .min(1)
    .max(24 * 60),
  difficulty: recipeDifficultySchema,
  substitutions: z.array(recipeSubstitutionSchema).default([]),
  pantryItemsUsed: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.7),
  caveats: z.array(z.string()).default([]),
  whySuggested: z.string().max(600),
  /**
   * Optional one-line observation the model wants to surface. The
   * orchestrator picks it into a single `notice` event; the field stays
   * on the recipe so non-streaming consumers see it too.
   */
  observation: z.string().max(280).nullable().default(null),
});
export type AIRecipe = z.infer<typeof aiRecipeSchema>;

/**
 * Streaming partial: every field optional so the emitter can publish
 * mid-stream snapshots while the model is still producing the recipe.
 */
export const aiRecipePartialSchema = aiRecipeSchema.partial();
export type AIRecipePartial = z.infer<typeof aiRecipePartialSchema>;

/** Persisted recipe DTO — the AI recipe plus its persistence identity. */
export const recipeSchema = aiRecipeSchema.extend({
  id: z.uuid(),
  userId: z.string().min(1),
  prompt: z.string().min(1),
  weirdness: z.number().int().min(0).max(100),
  createdAt: z.string(),
});
export type Recipe = z.infer<typeof recipeSchema>;
