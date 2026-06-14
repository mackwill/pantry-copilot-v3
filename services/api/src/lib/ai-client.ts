import {
  type AIImageExtractionRequest,
  type AIImageExtractionResponse,
  aiImageExtractionResponseSchema,
} from '@pantry/contracts';

export interface AiClientCallOptions {
  /** Propagated to the AI service as `x-request-id` for end-to-end tracing. */
  requestId: string;
}

export interface AiClient {
  extractFromImage(req: AIImageExtractionRequest, opts: AiClientCallOptions): Promise<AIImageExtractionResponse>;
}

export interface HttpAiClientConfig {
  baseUrl: string;
  token: string | undefined;
}

/** Typed REST wrapper around the AI service. The only AI client in the system. */
export function createHttpAiClient(config: HttpAiClientConfig): AiClient {
  return {
    async extractFromImage(req, opts) {
      const res = await fetch(`${config.baseUrl}/scans/extract`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-request-id': opts.requestId,
          ...(config.token === undefined ? {} : { authorization: `Bearer ${config.token}` }),
        },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        throw new Error(`AI service /scans/extract responded ${String(res.status)}`);
      }
      const json: unknown = await res.json();
      return aiImageExtractionResponseSchema.parse(json);
    },
  };
}
