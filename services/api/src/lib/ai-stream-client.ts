import {
  type AIGenerationRequest,
  type AITweakRequest,
  type GenerationEvent,
  type RecipeTweakEvent,
  generationEventSchema,
  recipeTweakEventSchema,
} from '@pantry/contracts';
import type { ZodType } from 'zod';

export interface AiStreamCallOptions {
  /** Propagated to the AI service as `x-request-id` for end-to-end tracing. */
  requestId: string;
  /** Cancels the upstream request + reader when the subscriber unsubscribes. */
  signal: AbortSignal;
}

export interface AiStreamClient {
  streamGeneration(req: AIGenerationRequest, opts: AiStreamCallOptions): AsyncIterable<GenerationEvent>;
  streamTweak(req: AITweakRequest, opts: AiStreamCallOptions): AsyncIterable<RecipeTweakEvent>;
}

export interface HttpAiStreamClientConfig {
  baseUrl: string;
  token: string | undefined;
  fetchImpl?: typeof fetch;
}

/** Parse one SSE block's `data:` payload into a validated event, or null to drop it. */
function parseFrame<T>(block: string, schema: ZodType<T>): T | null {
  const dataLine = block.split('\n').find((line) => line.startsWith('data:'));
  if (!dataLine) return null; // `:` heartbeat comments and bare `event:`/`retry:` lines
  const payload = dataLine.slice('data:'.length).trim();
  if (payload.length === 0) return null;
  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    return null;
  }
  const parsed = schema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

/**
 * Raw server-to-server SSE reader. Buffers the byte stream, splits on the SSE
 * record separator (`\n\n`), drops heartbeat comments / invalid frames, and
 * Zod-validates each event against `schema`.
 *
 * Undici abort workaround: we drive a local `AbortController` for the fetch
 * and bridge the caller's `signal` to both `localController.abort()` and
 * `reader.cancel()`. Passing the caller's signal straight to `fetch` can
 * surface `ERR_INVALID_STATE` once the body reader is owned.
 */
async function* streamSse<T>(
  config: HttpAiStreamClientConfig,
  path: string,
  body: unknown,
  schema: ZodType<T>,
  opts: AiStreamCallOptions,
): AsyncIterable<T> {
  const doFetch = config.fetchImpl ?? fetch;
  const localController = new AbortController();
  const onAbort = (): void => {
    localController.abort();
  };
  opts.signal.addEventListener('abort', onAbort, { once: true });

  const res = await doFetch(`${config.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'text/event-stream',
      'x-request-id': opts.requestId,
      ...(config.token === undefined ? {} : { authorization: `Bearer ${config.token}` }),
    },
    body: JSON.stringify(body),
    signal: localController.signal,
  });

  if (!res.ok || res.body === null) {
    opts.signal.removeEventListener('abort', onAbort);
    throw new Error(`AI service ${path} responded ${String(res.status)}`);
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
        const event = parseFrame(block, schema);
        if (event) yield event;
        sep = buffer.indexOf('\n\n');
      }
    }
  } finally {
    opts.signal.removeEventListener('abort', onAbort);
    await reader.cancel().catch(() => undefined);
  }
}

export function createHttpAiStreamClient(config: HttpAiStreamClientConfig): AiStreamClient {
  return {
    streamGeneration: (req, opts) =>
      streamSse(config, '/recipes/generate/stream', req, generationEventSchema, opts),
    streamTweak: (req, opts) => streamSse(config, '/recipes/tweak/stream', req, recipeTweakEventSchema, opts),
  };
}
