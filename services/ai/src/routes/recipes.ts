import { aiGenerationRequestSchema, aiTweakRequestSchema } from '@pantry/contracts';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { AppDeps } from '../server.js';

/**
 * Heartbeat cadence. Corporate proxies / CDNs and cellular NAT drop idle
 * TCP connections after ~20–30s; a `:` comment frame every 10s keeps the
 * channel alive without confusing the EventSource parser.
 */
const HEARTBEAT_MS = 10_000;

/** Any streamed wire event — both unions carry a discriminating `type`. */
type WireEvent = { type: string; [key: string]: unknown };

/**
 * Shared SSE plumbing for the streaming recipe routes: headers, heartbeat,
 * client-disconnect detection, provider timeout, and a terminal `error`
 * frame on timeout/throw. The generation and tweak routes differ only in
 * which provider iterable they drive.
 */
async function pipeSseStream(
  reply: FastifyReply,
  req: FastifyRequest,
  deps: AppDeps,
  label: string,
  run: (signal: AbortSignal) => AsyncIterable<WireEvent>,
): Promise<void> {
  const controller = new AbortController();

  // Detect client disconnect via the *response* socket (not `req.raw`):
  // Fastify consumes the POST body up front, so `req.raw` emits `close`
  // immediately and would kill the stream on the first tick. State lives
  // on an object so the callbacks' mutations are visible across awaits.
  const state = { clientClosed: false, weEnded: false, timedOut: false };
  reply.raw.on('close', () => {
    if (state.weEnded) return;
    state.clientClosed = true;
    controller.abort();
  });

  reply.raw.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  });
  reply.raw.flushHeaders();
  reply.raw.write('retry: 30000\n\n');

  const writeEvent = (ev: WireEvent): void => {
    reply.raw.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
  };

  const heartbeat = setInterval(() => {
    if (!state.clientClosed) reply.raw.write(': hb\n\n');
  }, HEARTBEAT_MS);

  const timeout = setTimeout(() => {
    state.timedOut = true;
    controller.abort();
  }, deps.env.AI_PROVIDER_TIMEOUT_MS);

  req.log.info({ reqId: req.id, provider: deps.provider.name }, `${label}_open`);

  try {
    for await (const ev of run(controller.signal)) {
      if (state.clientClosed) break;
      writeEvent(ev);
    }
    if (state.timedOut && !state.clientClosed) {
      writeEvent({ type: 'error', code: 'timeout', message: 'Request timed out.', seq: -1, t: deps.env.AI_PROVIDER_TIMEOUT_MS });
    }
  } catch (err) {
    req.log.error({ reqId: req.id, err }, `${label}_error`);
    if (!state.clientClosed) {
      const message = err instanceof Error ? err.message.slice(0, 500) : 'unknown';
      writeEvent({ type: 'error', code: 'stream_failed', message, seq: -1, t: 0 });
    }
  } finally {
    clearInterval(heartbeat);
    clearTimeout(timeout);
    state.weEnded = true;
    if (!state.clientClosed) reply.raw.end();
  }
}

export function registerRecipeRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.post('/recipes/generate/stream', async (req, reply) => {
    const parsed = aiGenerationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Invalid generation request', issues: parsed.error.issues });
    }
    await pipeSseStream(reply, req, deps, 'recipe_stream', (signal) =>
      deps.provider.streamStructured(parsed.data, signal),
    );
    return reply;
  });

  app.post('/recipes/tweak/stream', async (req, reply) => {
    const parsed = aiTweakRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Invalid tweak request', issues: parsed.error.issues });
    }
    await pipeSseStream(reply, req, deps, 'tweak_stream', (signal) =>
      deps.provider.streamTweak(parsed.data, signal),
    );
    return reply;
  });
}
