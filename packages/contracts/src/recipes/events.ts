import { z } from 'zod';
import { recipeToolNameSchema } from './enums';
import { aiRecipePartialSchema, aiRecipeSchema } from './recipe';

/**
 * Envelope on every event. `seq` is monotonic per stream; `t` is
 * ms-since-stream-start. Together they let clients drop out-of-order
 * frames and render the design's mono timestamp readouts.
 */
const eventBase = {
  seq: z.number().int().nonnegative(),
  t: z.number().int().nonnegative(),
};

/** Server's opening frame: the pantry split it is generating from. */
export const pullingFromEventSchema = z.object({
  type: z.literal('pulling_from'),
  must: z.array(z.string().min(1).max(120)),
  maybe: z.array(z.string().min(1).max(120)),
  ...eventBase,
});

/** A delta of the model's reasoning prose; clients concatenate in arrival order. */
export const thinkingTokenEventSchema = z.object({
  type: z.literal('thinking_token'),
  text: z.string().max(4000),
  ...eventBase,
});

/**
 * A host-side tool call. The same `id` appears `pending` then
 * `complete`/`error`; clients update the entry in place. `display` and
 * `result` are pre-summarized strings — never raw JSON.
 */
export const toolEventSchema = z.object({
  type: z.literal('tool_event'),
  id: z.string().min(1).max(200),
  name: recipeToolNameSchema,
  state: z.enum(['pending', 'complete', 'error']),
  display: z.string().min(1).max(200),
  result: z.string().max(200).nullable().default(null),
  ...eventBase,
});

/**
 * A streaming snapshot of the single recipe. Idempotent — clients
 * overwrite their working copy on each emission. `complete` flips true
 * once the snapshot satisfies the full `aiRecipeSchema`.
 */
export const recipePartialEventSchema = z.object({
  type: z.literal('recipe_partial'),
  recipe: aiRecipePartialSchema,
  complete: z.boolean().default(false),
  ...eventBase,
});

/** A single surfaced observation (the recipe's `observation`, picked once). */
export const noticeEventSchema = z.object({
  type: z.literal('notice'),
  text: z.string().min(1).max(280),
  ...eventBase,
});

/**
 * Terminal success. The AI service emits it with `recipeId: null`; the
 * API persists the recipe and re-emits with the real persisted id.
 */
export const doneEventSchema = z.object({
  type: z.literal('done'),
  recipe: aiRecipeSchema,
  recipeId: z.uuid().nullable().default(null),
  ...eventBase,
});

export const errorEventSchema = z.object({
  type: z.literal('error'),
  code: z.string().min(1).max(80),
  message: z.string().max(500),
  ...eventBase,
});

export const abortedEventSchema = z.object({
  type: z.literal('aborted'),
  ...eventBase,
});

/** The wire contract — single source of truth for the SSE frames. */
export const generationEventSchema = z.discriminatedUnion('type', [
  pullingFromEventSchema,
  thinkingTokenEventSchema,
  toolEventSchema,
  recipePartialEventSchema,
  noticeEventSchema,
  doneEventSchema,
  errorEventSchema,
  abortedEventSchema,
]);
export type GenerationEvent = z.infer<typeof generationEventSchema>;

export type PullingFromEvent = z.infer<typeof pullingFromEventSchema>;
export type ThinkingTokenEvent = z.infer<typeof thinkingTokenEventSchema>;
export type ToolEvent = z.infer<typeof toolEventSchema>;
export type RecipePartialEvent = z.infer<typeof recipePartialEventSchema>;
export type NoticeEvent = z.infer<typeof noticeEventSchema>;
export type DoneEvent = z.infer<typeof doneEventSchema>;
export type ErrorEvent = z.infer<typeof errorEventSchema>;
export type AbortedEvent = z.infer<typeof abortedEventSchema>;
