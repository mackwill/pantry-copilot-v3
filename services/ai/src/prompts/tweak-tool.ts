import { RECIPE_CHANGE_TAGS } from '@pantry/contracts';
import { RECIPE_EMIT_TOOL_SCHEMA } from './recipe-tool.js';

/** A minimal JSON-Schema object both SDKs' tool/function parameters accept. */
interface JsonObjectSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
  [key: string]: unknown;
}

/**
 * The updated recipe carries the same shape as a generated recipe, plus the
 * `edited`/`added` provenance flags the co-pilot sets on the ingredients it
 * touched. Reuses the generation schema and only re-specifies `ingredients`.
 */
const updatedRecipeSchema: JsonObjectSchema = {
  ...RECIPE_EMIT_TOOL_SCHEMA,
  properties: {
    ...RECIPE_EMIT_TOOL_SCHEMA.properties,
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: ['number', 'null'] },
          unit: { type: ['string', 'null'] },
          optional: { type: 'boolean' },
          note: { type: ['string', 'null'] },
          edited: { type: 'boolean' },
          added: { type: 'boolean' },
        },
        required: ['name'],
      },
    },
  },
};

/**
 * JSON Schema for the terminal `emit_tweak` tool call — shared by the
 * Anthropic and OpenAI adapters. Mirrors `recipeTweakResponseSchema`; the
 * output is re-validated against the Zod schema before it is trusted.
 * `summary` is listed first so it streams (and completes) before the recipe.
 */
export const TWEAK_EMIT_TOOL_SCHEMA: JsonObjectSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    changes: {
      type: 'array',
      minItems: 1,
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          tag: { type: 'string', enum: [...RECIPE_CHANGE_TAGS] },
          text: { type: 'string' },
        },
        required: ['tag', 'text'],
      },
    },
    updatedRecipe: updatedRecipeSchema,
  },
  required: ['summary', 'changes', 'updatedRecipe'],
};

export const TWEAK_EMIT_TOOL_DESCRIPTION =
  'Emit the tweaked recipe as structured JSON: a one-line summary, the tagged ' +
  'list of changes, and the full updated recipe. Call exactly once.';
