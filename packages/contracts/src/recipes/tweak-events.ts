import { z } from 'zod';
import { abortedEventSchema, errorEventSchema } from './events';
import { aiRecipePartialSchema } from './recipe';
import { recipeTweakResponseSchema } from './tweak';

/**
 * Same envelope as the generation stream (`events.ts`): `seq` is monotonic
 * per stream, `t` is ms-since-stream-start. Re-declared locally to mirror
 * the generation wire's private convention.
 */
const eventBase = {
  seq: z.number().int().nonnegative(),
  t: z.number().int().nonnegative(),
};

/** Growing summary prose — clients concatenate in arrival order. */
export const tweakSummaryEventSchema = z.object({
  type: z.literal('tweak_summary'),
  text: z.string().max(4000),
  ...eventBase,
});

/**
 * A streaming snapshot of the updated recipe. Idempotent — clients
 * overwrite their working copy on each emission. `complete` flips true once
 * the snapshot satisfies the full `aiRecipeSchema`.
 */
export const tweakRecipePartialEventSchema = z.object({
  type: z.literal('tweak_recipe_partial'),
  recipe: aiRecipePartialSchema,
  complete: z.boolean().default(false),
  ...eventBase,
});

/**
 * Terminal success. The AI service emits it with `recipeId: null` and a
 * placeholder `turn`; the API persists the turn (bumping `version`) and
 * re-emits with the real persisted `recipeId`/`turn`/`version`. The change
 * chips ride in on `response.changes` — there is no separate chip event.
 */
export const tweakDoneEventSchema = z.object({
  type: z.literal('tweak_done'),
  response: recipeTweakResponseSchema,
  recipeId: z.uuid().nullable().default(null),
  turn: z.number().int().nonnegative(),
  version: z.number().int().positive(),
  ...eventBase,
});

/** The wire contract for the tweak SSE stream. */
export const recipeTweakEventSchema = z.discriminatedUnion('type', [
  tweakSummaryEventSchema,
  tweakRecipePartialEventSchema,
  tweakDoneEventSchema,
  errorEventSchema,
  abortedEventSchema,
]);
export type RecipeTweakEvent = z.infer<typeof recipeTweakEventSchema>;

export type TweakSummaryEvent = z.infer<typeof tweakSummaryEventSchema>;
export type TweakRecipePartialEvent = z.infer<typeof tweakRecipePartialEventSchema>;
export type TweakDoneEvent = z.infer<typeof tweakDoneEventSchema>;
