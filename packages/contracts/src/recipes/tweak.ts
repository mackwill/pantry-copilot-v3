import { z } from 'zod';
import { aiRecipeSchema } from './recipe';

/**
 * How a single change reads in the UI. Drives the ChangeChip tone map
 * (change=warning, add=accent, remove=danger, note=neutral) — see the
 * board's recipe-chat-b frame.
 */
export const RECIPE_CHANGE_TAGS = ['change', 'add', 'remove', 'note'] as const;
export const recipeChangeTagSchema = z.enum(RECIPE_CHANGE_TAGS);
export type RecipeChangeTag = z.infer<typeof recipeChangeTagSchema>;

/** One tagged change chip the co-pilot surfaces for a tweak turn. */
export const recipeChangeSchema = z.object({
  tag: recipeChangeTagSchema,
  text: z.string().min(1).max(120),
});
export type RecipeChange = z.infer<typeof recipeChangeSchema>;

/**
 * The structured result the model emits once per tweak turn: a one-line
 * summary, 1–8 change chips, and the full updated recipe (with `edited`/
 * `added` flags on the ingredients it touched).
 */
export const recipeTweakResponseSchema = z.object({
  summary: z.string().min(1).max(280),
  changes: z.array(recipeChangeSchema).min(1).max(8),
  updatedRecipe: aiRecipeSchema,
});
export type RecipeTweakResponse = z.infer<typeof recipeTweakResponseSchema>;

/** A persisted tweak turn, hydrated into the chat thread. */
export const recipeTweakTurnSchema = z.object({
  id: z.uuid(),
  turn: z.number().int().positive(),
  userMessage: z.string().min(1).max(500),
  summary: z.string().max(280),
  changes: z.array(recipeChangeSchema),
  createdAt: z.string(),
});
export type RecipeTweakTurn = z.infer<typeof recipeTweakTurnSchema>;

/** Client → API: ask the co-pilot to tweak a saved recipe. */
export const recipeTweakRequestSchema = z.object({
  recipeId: z.uuid(),
  prompt: z.string().trim().min(1).max(500),
});
export type RecipeTweakRequest = z.infer<typeof recipeTweakRequestSchema>;

/** Client → API: restore a recipe to its pre-tweak snapshot. */
export const recipeRevertInputSchema = z.object({
  recipeId: z.uuid(),
});
export type RecipeRevertInput = z.infer<typeof recipeRevertInputSchema>;

/**
 * One prior turn the AI service replays for context (server-to-server).
 * Trimmed from the persisted turn — no identity, just the conversation.
 */
export const aiTweakTurnSchema = z.object({
  userMessage: z.string().min(1).max(500),
  summary: z.string().max(280),
  changes: z.array(recipeChangeSchema).default([]),
});
export type AITweakTurn = z.infer<typeof aiTweakTurnSchema>;

/**
 * The request the AI service receives (server-to-server). The API resolves
 * the live recipe `data` + ordered prior tweak turns before calling.
 */
export const aiTweakRequestSchema = z.object({
  recipe: aiRecipeSchema,
  prompt: z.string().trim().min(1).max(500),
  priorTurns: z.array(aiTweakTurnSchema).default([]),
});
export type AITweakRequest = z.infer<typeof aiTweakRequestSchema>;
