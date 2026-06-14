import { type AIImageExtractionResponse, type AIProviderName, aiImageExtractionResponseSchema } from '@pantry/contracts';
import { normalizeScanIngredients } from '../pipelines/scan-normalize.js';

export interface RawToolOutput {
  ingredients?: unknown;
  duplicatesMerged?: unknown;
  reviewNotes?: unknown;
}

/** Coerce a forced-tool JSON payload into a validated extraction response. */
export function buildExtractionResult(args: {
  provider: AIProviderName;
  model: string;
  output: RawToolOutput;
  tokensUsed: { input: number; output: number };
}): AIImageExtractionResponse {
  const { provider, model, output, tokensUsed } = args;
  const ingredients = normalizeScanIngredients(Array.isArray(output.ingredients) ? output.ingredients : []);
  return aiImageExtractionResponseSchema.parse({
    provider,
    model,
    result: {
      ingredients,
      duplicatesMerged: Array.isArray(output.duplicatesMerged) ? output.duplicatesMerged : [],
      reviewNotes: typeof output.reviewNotes === 'string' ? output.reviewNotes : null,
    },
    tokensUsed,
  });
}
