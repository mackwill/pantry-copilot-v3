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
  /**
   * Tweak provenance (M7): the recipe co-pilot flags ingredients it changed
   * or introduced so the doc can render the accent dot + "· edited" /
   * "· added by tweak" labels. Optional + absent on untweaked recipes, so
   * older persisted recipes parse unchanged.
   */
  edited: z.boolean().optional(),
  added: z.boolean().optional(),
});
export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

export const recipeSubstitutionSchema = z.object({
  ingredient: z.string().min(1).max(120),
  suggestion: z.string().min(1).max(200),
  reason: z.string().max(280).nullable().default(null),
});
export type RecipeSubstitution = z.infer<typeof recipeSubstitutionSchema>;

/**
 * One cooking step. `label` is a short verb the in-session UI shows above the
 * heading (e.g. "simmer"); `durationMinutes` seeds the client-side countdown
 * ring. Both optional — an untimed prep step carries only `text`.
 */
export const recipeStepSchema = z.object({
  text: z.string().min(1).max(1200),
  label: z.string().min(1).max(40).optional(),
  durationMinutes: z.number().int().min(1).max(24 * 60).optional(),
});
export type RecipeStep = z.infer<typeof recipeStepSchema>;

/**
 * Read path tolerant of M4's legacy plain-string steps: a bare string is
 * coerced to `{ text }`, a structured object validates as-is. The trailing
 * `.pipe` re-validates each coerced step so the inferred output is `RecipeStep`.
 */
const recipeStepInputSchema = z.union([
  z.string().min(1).max(1200).transform((text) => ({ text })),
  recipeStepSchema,
]);

/** The recipe the model produces. Source of truth for the generation payload. */
export const aiRecipeSchema = z.object({
  title: z.string().min(1).max(160),
  summary: z.string().max(400),
  weirdnessScore: z.number().int().min(0).max(100),
  ingredients: z.array(recipeIngredientSchema).min(1),
  steps: z.array(recipeStepInputSchema).min(1).pipe(z.array(recipeStepSchema)),
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
