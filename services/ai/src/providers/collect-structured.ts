import type { AIGenerationRequest } from '@pantry/contracts';
import type { RawProviderEvent, RawProviderRunner } from './stream-orchestrator.js';
import type { StructuredRecipeResult } from './types.js';

/**
 * Drive a raw provider runner to completion (non-streaming) and return
 * its final recipe + token usage. Backs `generateStructured` for the real
 * providers so the one-shot and streaming paths share one implementation.
 */
export async function collectStructured(runRaw: RawProviderRunner, req: AIGenerationRequest): Promise<StructuredRecipeResult> {
  const controller = new AbortController();
  let completed: Extract<RawProviderEvent, { type: 'completed' }> | null = null;
  for await (const event of runRaw(req, controller.signal)) {
    if (event.type === 'completed') completed = event;
  }
  if (!completed) throw new Error('provider produced no recipe');
  return { recipe: completed.recipe, tokensUsed: completed.tokensUsed };
}
