import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { readEnv } from '../env.js';
import { createDeps } from '../server.js';
import { buildServer } from '../server.js';

const TOKEN = 'test-service-token-0123456789abcdef';
const AUTH = { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' };

function makeDeps() {
  return createDeps(readEnv({ NODE_ENV: 'test', AI_SERVICE_TOKEN: TOKEN, DEFAULT_AI_PROVIDER: 'mock' }));
}

const BODY = { prompt: 'something with scallions', weirdness: 40, pantry: [{ name: 'Scallions', expiresInDays: 2 }], mustInclude: [] };

function parseFrames(body: string): { type: string }[] {
  return body
    .split('\n\n')
    .map((block) => block.split('\n').find((l) => l.startsWith('data:')))
    .filter((l): l is string => Boolean(l))
    .map((l) => JSON.parse(l.slice('data:'.length).trim()) as { type: string });
}

let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('POST /recipes/generate/stream', () => {
  it('streams ordered SSE frames terminating in done', async () => {
    app = await buildServer(makeDeps());
    const res = await app.inject({ method: 'POST', url: '/recipes/generate/stream', headers: AUTH, payload: BODY });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    const frames = parseFrames(res.body);
    expect(frames[0]?.type).toBe('pulling_from');
    expect(frames.at(-1)?.type).toBe('done');
    expect(frames.some((f) => f.type === 'recipe_partial')).toBe(true);
  });

  it('rejects an unauthenticated request with 401', async () => {
    app = await buildServer(makeDeps());
    const res = await app.inject({ method: 'POST', url: '/recipes/generate/stream', headers: { 'content-type': 'application/json' }, payload: BODY });
    expect(res.statusCode).toBe(401);
  });

  it('rejects an invalid body with 400', async () => {
    app = await buildServer(makeDeps());
    const res = await app.inject({ method: 'POST', url: '/recipes/generate/stream', headers: AUTH, payload: { prompt: '', weirdness: 40 } });
    expect(res.statusCode).toBe(400);
  });
});
