import type { AIImageExtractionRequest, AIImageExtractionResponse } from '@pantry/contracts';
import { type AIProvider, notImplementedUntilM4 } from './types.js';

export type FallbackErrorHandler = (failedProvider: string, err: unknown) => void;

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * The single fallback decorator for the whole service (kills v2's duplicated
 * adapters). Tries `primary`; on a thrown error it notifies `onError`, then
 * tries `fallback`. If both fail it surfaces one structured error carrying both
 * causes.
 */
export function withFallback(primary: AIProvider, fallback: AIProvider, onError?: FallbackErrorHandler): AIProvider {
  return {
    name: primary.name,
    generateStructured: () => notImplementedUntilM4('generateStructured'),
    streamStructured: () => notImplementedUntilM4('streamStructured'),
    async extractFromImage(req: AIImageExtractionRequest): Promise<AIImageExtractionResponse> {
      try {
        return await primary.extractFromImage(req);
      } catch (primaryErr) {
        onError?.(primary.name, primaryErr);
        try {
          return await fallback.extractFromImage(req);
        } catch (fallbackErr) {
          onError?.(fallback.name, fallbackErr);
          throw new Error(
            `Both AI providers failed — ${primary.name}: ${message(primaryErr)}; ${fallback.name}: ${message(fallbackErr)}`,
            { cause: fallbackErr },
          );
        }
      }
    },
  };
}
