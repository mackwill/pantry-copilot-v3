import type { AIGenerationRequest, AIImageExtractionRequest, AIImageExtractionResponse, GenerationEvent } from '@pantry/contracts';
import type { AIProvider, StructuredRecipeResult } from './types.js';

export type FallbackErrorHandler = (failedProvider: string, err: unknown) => void;

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * The single fallback decorator for the whole service (kills v2's duplicated
 * adapters). Tries `primary`; on a thrown error it notifies `onError`, then
 * tries `fallback`. If both fail it surfaces one structured error carrying both
 * causes.
 *
 * Streaming caveat: a mid-stream failure cannot be retried (frames are
 * already on the wire), so `streamStructured` only falls back when the
 * primary throws *before* yielding its first event.
 */
export function withFallback(primary: AIProvider, fallback: AIProvider, onError?: FallbackErrorHandler): AIProvider {
  return {
    name: primary.name,
    async generateStructured(req: AIGenerationRequest): Promise<StructuredRecipeResult> {
      try {
        return await primary.generateStructured(req);
      } catch (primaryErr) {
        onError?.(primary.name, primaryErr);
        try {
          return await fallback.generateStructured(req);
        } catch (fallbackErr) {
          onError?.(fallback.name, fallbackErr);
          throw new Error(
            `Both AI providers failed — ${primary.name}: ${message(primaryErr)}; ${fallback.name}: ${message(fallbackErr)}`,
            { cause: fallbackErr },
          );
        }
      }
    },
    async *streamStructured(req: AIGenerationRequest, signal: AbortSignal): AsyncIterable<GenerationEvent> {
      let started = false;
      try {
        for await (const ev of primary.streamStructured(req, signal)) {
          started = true;
          yield ev;
        }
        return;
      } catch (primaryErr) {
        onError?.(primary.name, primaryErr);
        if (started) throw primaryErr; // cannot safely restart a stream already in flight
      }
      yield* fallback.streamStructured(req, signal);
    },
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
