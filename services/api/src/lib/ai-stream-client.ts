import { type AIGenerationRequest, type GenerationEvent, generationEventSchema } from '@pantry/contracts';

export interface AiStreamCallOptions {
  /** Propagated to the AI service as `x-request-id` for end-to-end tracing. */
  requestId: string;
  /** Cancels the upstream request + reader when the subscriber unsubscribes. */
  signal: AbortSignal;
}

export interface AiStreamClient {
  streamGeneration(req: AIGenerationRequest, opts: AiStreamCallOptions): AsyncIterable<GenerationEvent>;
}

export interface HttpAiStreamClientConfig {
  baseUrl: string;
  token: string | undefined;
  fetchImpl?: typeof fetch;
}

/** Parse one SSE block's `data:` payload into a validated event, or null to drop it. */
function parseFrame(block: string): GenerationEvent | null {
  const dataLine = block
    .split('\n')
    .find((line) => line.startsWith('data:'));
  if (!dataLine) return null; // `:` heartbeat comments and bare `event:`/`retry:` lines
  const payload = dataLine.slice('data:'.length).trim();
  if (payload.length === 0) return null;
  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return null;
  }
  const parsed = generationEventSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

/**
 * Raw server-to-server SSE reader for the AI service's generation stream.
 * Buffers the byte stream, splits on the SSE record separator (`\n\n`),
 * drops heartbeat comments / invalid frames, and Zod-validates each event.
 *
 * Undici abort workaround: we drive a local `AbortController` for the
 * fetch and bridge the caller's `signal` to both `localController.abort()`
 * and `reader.cancel()`. Passing the caller's signal straight to
 * `fetch` can surface `ERR_INVALID_STATE` once the body reader is owned.
 */
export function createHttpAiStreamClient(config: HttpAiStreamClientConfig): AiStreamClient {
  const doFetch = config.fetchImpl ?? fetch;
  return {
    async *streamGeneration(req, opts) {
      const localController = new AbortController();
      const onAbort = (): void => {
        localController.abort();
      };
      opts.signal.addEventListener('abort', onAbort, { once: true });

      const res = await doFetch(`${config.baseUrl}/recipes/generate/stream`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'text/event-stream',
          'x-request-id': opts.requestId,
          ...(config.token === undefined ? {} : { authorization: `Bearer ${config.token}` }),
        },
        body: JSON.stringify(req),
        signal: localController.signal,
      });

      if (!res.ok || res.body === null) {
        opts.signal.removeEventListener('abort', onAbort);
        throw new Error(`AI service /recipes/generate/stream responded ${String(res.status)}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep = buffer.indexOf('\n\n');
          while (sep !== -1) {
            const block = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const event = parseFrame(block);
            if (event) yield event;
            sep = buffer.indexOf('\n\n');
          }
        }
      } finally {
        opts.signal.removeEventListener('abort', onAbort);
        await reader.cancel().catch(() => undefined);
      }
    },
  };
}
