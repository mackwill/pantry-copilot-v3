import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { createDeps, buildServer } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

describe('server skeleton', () => {
  let testDb: TestDb;
  let app: FastifyInstance;

  beforeAll(async () => {
    testDb = await createTestDb();
    const env = readEnv({
      NODE_ENV: 'test',
      DATABASE_URL: testDb.url,
      BETTER_AUTH_SECRET: 'a'.repeat(32),
      RATE_LIMIT_MAX: '5',
    });
    app = await buildServer(createDeps(env));
  });
  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('GET /ready returns ready when the database answers', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
  });

  it('sets hardening headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  it('allows the configured origin with credentials and ignores others', async () => {
    const ok = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:3000' },
    });
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const bad = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://evil.example' },
    });
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rate-limits past the global max but exempts /health', async () => {
    // RATE_LIMIT_MAX=5 above. /health is allow-listed; another route is not.
    for (let i = 0; i < 10; i += 1) {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
    }
    let limited = false;
    for (let i = 0; i < 10; i += 1) {
      const res = await app.inject({ method: 'GET', url: '/nope' });
      if (res.statusCode === 429) limited = true;
    }
    expect(limited).toBe(true);
  });
});
