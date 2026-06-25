import { describe, expect, it } from 'vitest';
import type { Env } from './env.js';
import { buildServer, type AppDeps } from './server.js';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: 4001,
  AI_SERVICE_TOKEN: '0123456789012345678901234567890123',
  DEFAULT_AI_PROVIDER: 'mock',
  DEFAULT_AI_MODEL: 'claude-sonnet-4-6',
  OPENAI_MODEL: 'gpt-4o',
  AI_PROVIDER_TIMEOUT_MS: 60_000,
} as unknown as Env;

function deps(env: Env): AppDeps {
  return { env, provider: { name: env.DEFAULT_AI_PROVIDER } as AppDeps['provider'] };
}

describe('GET /ready', () => {
  it('is ready with the mock provider and needs no auth', async () => {
    const app = await buildServer(deps(baseEnv));
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ready' });
    await app.close();
  });

  it('is not ready when anthropic is selected without an API key', async () => {
    const app = await buildServer(deps({ ...baseEnv, DEFAULT_AI_PROVIDER: 'anthropic' }));
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'not_ready' });
    await app.close();
  });
});
