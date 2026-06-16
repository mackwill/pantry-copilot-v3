import type {
  AIGenerationRequest,
  AIImageExtractionRequest,
  AIImageExtractionResponse,
  AIProviderName,
  AIRecipe,
  GenerationEvent,
} from '@pantry/contracts';

export interface TokenUsage {
  readonly input: number;
  readonly output: number;
}

/** One-shot structured generation result. */
export interface StructuredRecipeResult {
  readonly recipe: AIRecipe;
  readonly tokensUsed: TokenUsage;
}

/**
 * The single seam the whole AI stack hangs off. `extractFromImage` lands
 * in M3; `generateStructured` / `streamStructured` (recipe generation)
 * land in M4. `streamStructured` is the streaming path the SSE route
 * consumes; `generateStructured` is the non-streaming convenience used by
 * smoke tests and future one-shot callers.
 */
export interface AIProvider {
  readonly name: AIProviderName;
  generateStructured(req: AIGenerationRequest): Promise<StructuredRecipeResult>;
  streamStructured(req: AIGenerationRequest, signal: AbortSignal): AsyncIterable<GenerationEvent>;
  extractFromImage(req: AIImageExtractionRequest): Promise<AIImageExtractionResponse>;
}
