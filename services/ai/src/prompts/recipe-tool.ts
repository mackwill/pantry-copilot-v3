/** A minimal JSON-Schema object both SDKs' tool/function parameters accept. */
interface JsonObjectSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required: string[];
  [key: string]: unknown;
}

/**
 * JSON Schema for the terminal `emit_recipe` tool call — shared by the
 * Anthropic and OpenAI adapters. Mirrors `aiRecipeSchema`; the provider
 * output is re-validated against the Zod schema before it is trusted.
 */
export const RECIPE_EMIT_TOOL_SCHEMA: JsonObjectSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    weirdnessScore: { type: 'integer', minimum: 0, maximum: 100 },
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
        },
        required: ['name'],
      },
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          label: { type: 'string' },
          durationMinutes: { type: 'integer', minimum: 1 },
        },
        required: ['text'],
      },
    },
    timeMinutes: { type: 'integer', minimum: 1 },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    substitutions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ingredient: { type: 'string' },
          suggestion: { type: 'string' },
          reason: { type: ['string', 'null'] },
        },
        required: ['ingredient', 'suggestion'],
      },
    },
    pantryItemsUsed: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    caveats: { type: 'array', items: { type: 'string' } },
    whySuggested: { type: 'string' },
    observation: { type: ['string', 'null'] },
  },
  required: ['title', 'summary', 'weirdnessScore', 'ingredients', 'steps', 'timeMinutes', 'difficulty', 'whySuggested'],
};

export const RECIPE_EMIT_TOOL_DESCRIPTION = 'Emit the final selected recipe as structured JSON. Call exactly once.';
