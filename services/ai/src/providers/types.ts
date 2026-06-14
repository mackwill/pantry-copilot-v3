import type { AIImageExtractionRequest, AIImageExtractionResponse, AIProviderName } from '@pantry/contracts';
import type { z } from 'zod';

export interface TokenUsage {
  readonly input: number;
  readonly output: number;
}

/** Structured-generation request — body lands in M4. */
export interface StructuredRequest<T> {
  readonly system: string;
  readonly prompt: string;
  readonly schema: z.ZodType<T>;
}

export interface StructuredResult<T> {
  readonly value: T;
  readonly tokensUsed: TokenUsage;
}

/** Streaming event — the full union lands in M4. */
export type StreamEvent = { readonly type: 'delta'; readonly text: string } | { readonly type: 'done' };

/**
 * The single seam the whole AI stack hangs off. Only `extractFromImage` is
 * implemented in M3; `generateStructured` / `streamStructured` are typed stubs
 * (bodies in M4) so the interface is stable now without `any`.
 */
export interface AIProvider {
  readonly name: AIProviderName;
  generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResult<T>>;
  streamStructured<T>(req: StructuredRequest<T>): AsyncIterable<StreamEvent>;
  extractFromImage(req: AIImageExtractionRequest): Promise<AIImageExtractionResponse>;
}

/**
 * Shared stub for the M4 methods. Returns `never`, which is assignable to any
 * provider return type, so each provider can delegate without unused-param
 * noise or `any`.
 */
export function notImplementedUntilM4(method: string): never {
  throw new Error(`${method} is not implemented until M4`);
}
