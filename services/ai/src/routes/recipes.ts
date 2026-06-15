import { type GenerationEvent, aiGenerationRequestSchema } from '@pantry/contracts';
import type { FastifyInstance } from 'fastify';
import type { AppDeps } from '../server.js';

/**
 * Heartbeat cadence. Corporate proxies / CDNs and cellular NAT drop idle
 * TCP connections after ~20–30s; a `:` comment frame every 10s keeps the
 * channel alive without confusing the EventSource parser.
 */
const HEARTBEAT_MS = 10_000;

export function registerRecipeRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.post('/recipes/generate/stream', async (req, reply) => {
    const parsed = aiGenerationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Invalid generation request', issues: parsed.error.issues });
    }

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

    const writeEvent = (ev: GenerationEvent): void => {
      reply.raw.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
    };

    const heartbeat = setInterval(() => {
      if (!state.clientClosed) reply.raw.write(': hb\n\n');
    }, HEARTBEAT_MS);

    const timeout = setTimeout(() => {
      state.timedOut = true;
      controller.abort();
    }, deps.env.AI_PROVIDER_TIMEOUT_MS);

    req.log.info({ reqId: req.id, provider: deps.provider.name }, 'recipe_stream_open');

    try {
      for await (const ev of deps.provider.streamStructured(parsed.data, controller.signal)) {
        if (state.clientClosed) break;
        writeEvent(ev);
      }
      if (state.timedOut && !state.clientClosed) {
        writeEvent({ type: 'error', code: 'timeout', message: 'Generation timed out.', seq: -1, t: deps.env.AI_PROVIDER_TIMEOUT_MS });
      }
    } catch (err) {
      req.log.error({ reqId: req.id, err }, 'recipe_stream_error');
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

    return reply;
  });
}
