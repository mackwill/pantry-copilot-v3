import { z } from 'zod';

/** Weirdness bands (ascending intensity) — drive prompt calibration, not the UI labels. */
export const WEIRDNESS_BANDS = ['normal', 'curious', 'interesting', 'adventurous', 'chaotic'] as const;

/** The four one-tap branch re-prompts on the §02 Result screen. */
export const BRANCH_ACTIONS = ['weirder', 'faster', 'vegetarian', 'new-angle'] as const;

/** Recipe difficulty levels. */
export const RECIPE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

/**
 * Host-side tools the model may call during the thinking beat. The wire
 * enforces this enum on every `tool_event` so the UI's label map stays
 * exhaustive. The terminal tool is `emit_recipe` (single recipe).
 */
export const RECIPE_TOOL_NAMES = [
  'read_pantry',
  'filter_expiring',
  'search_pantry_combos',
  'rank_candidates',
  'emit_recipe',
] as const;

export const weirdnessBandSchema = z.enum(WEIRDNESS_BANDS);
export const branchActionSchema = z.enum(BRANCH_ACTIONS);
export const recipeDifficultySchema = z.enum(RECIPE_DIFFICULTIES);
export const recipeToolNameSchema = z.enum(RECIPE_TOOL_NAMES);

export type WeirdnessBand = z.infer<typeof weirdnessBandSchema>;
export type BranchAction = z.infer<typeof branchActionSchema>;
export type RecipeDifficulty = z.infer<typeof recipeDifficultySchema>;
export type RecipeToolName = z.infer<typeof recipeToolNameSchema>;
