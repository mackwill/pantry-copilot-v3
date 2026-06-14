import type { AIImageExtractionResponse } from '@pantry/contracts';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { readEnv } from '../env.js';
import { mockProvider } from '../providers/mock.js';
import { type AIProvider, notImplementedUntilM4 } from '../providers/types.js';
import { buildServer } from '../server.js';

const TOKEN = 'test-service-token-0123456789abcdef';
const AUTH = { authorization: `Bearer ${TOKEN}` };

function makeEnv() {
  return readEnv({ NODE_ENV: 'test', AI_SERVICE_TOKEN: TOKEN, DEFAULT_AI_PROVIDER: 'mock' });
}

const throwingProvider: AIProvider = {
  name: 'mock',
  generateStructured: () => notImplementedUntilM4('generateStructured'),
  streamStructured: () => notImplementedUntilM4('streamStructured'),
  extractFromImage: (): Promise<AIImageExtractionResponse> => Promise.reject(new Error('provider exploded')),
};

let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('POST /scans/extract', () => {
  it('extracts items via the configured provider', async () => {
    app = await buildServer({ env: makeEnv(), provider: mockProvider });
    const res = await app.inject({
      method: 'POST',
      url: '/scans/extract',
      headers: AUTH,
      payload: { imageBase64: 'aGVsbG8=', mediaType: 'image/jpeg' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<AIImageExtractionResponse>();
    expect(body.provider).toBe('mock');
    expect(body.result.ingredients).toHaveLength(7);
    expect(body.result.ingredients.map((i) => i.name)).toContain('Whole milk');
  });

  it('rejects an invalid request body with 400', async () => {
    app = await buildServer({ env: makeEnv(), provider: mockProvider });
    const res = await app.inject({
      method: 'POST',
      url: '/scans/extract',
      headers: AUTH,
      payload: { imageBase64: 'aGVsbG8=', mediaType: 'image/gif' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns a valid empty result (never 500) when the provider fails', async () => {
    app = await buildServer({ env: makeEnv(), provider: throwingProvider });
    const res = await app.inject({
      method: 'POST',
      url: '/scans/extract',
      headers: AUTH,
      payload: { imageBase64: 'aGVsbG8=', mediaType: 'image/jpeg' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json<AIImageExtractionResponse>();
    expect(body.result.ingredients).toHaveLength(0);
    expect(body.result.reviewNotes).toBeTruthy();
  });
});
