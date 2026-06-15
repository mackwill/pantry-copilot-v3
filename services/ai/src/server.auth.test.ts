import type { AIImageExtractionResponse } from '@pantry/contracts';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readEnv } from './env.js';
import { buildServer } from './server.js';
import type { AIProvider } from './providers/types.js';

const TEST_TOKEN = 'test-service-token-0123456789abcdef';

const stubProvider: AIProvider = {
  name: 'mock',
  generateStructured: () => Promise.reject(new Error('not used')),
  streamStructured: () => { throw new Error('not used'); },
  extractFromImage: (): Promise<AIImageExtractionResponse> =>
    Promise.resolve({
      provider: 'mock',
      model: 'mock-vision',
      result: { ingredients: [], duplicatesMerged: [], reviewNotes: null },
      tokensUsed: { input: 0, output: 0 },
    }),
};

describe('AI service auth + health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const env = readEnv({ NODE_ENV: 'test', AI_SERVICE_TOKEN: TEST_TOKEN, DEFAULT_AI_PROVIDER: 'mock' });
    app = await buildServer({ env, provider: stubProvider });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves /health without a token', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('rejects /scans/extract without a bearer token', async () => {
    const res = await app.inject({ method: 'POST', url: '/scans/extract', payload: {} });
    expect(res.statusCode).toBe(401);
  });

  it('rejects /scans/extract with a wrong token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/scans/extract',
      headers: { authorization: 'Bearer nope' },
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });

  it('echoes an incoming x-request-id back on the response', async () => {
    const res = await app.inject({ method: 'GET', url: '/health', headers: { 'x-request-id': 'req-abc-123' } });
    expect(res.headers['x-request-id']).toBe('req-abc-123');
  });
});
