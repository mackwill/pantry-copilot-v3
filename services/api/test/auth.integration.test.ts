import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

function cookieOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .filter((c): c is string => typeof c === 'string')
    .map((c) => c.split(';')[0] ?? '')
    .join('; ');
}

describe('better auth over fastify', () => {
  let testDb: TestDb;
  let app: FastifyInstance;

  beforeAll(async () => {
    testDb = await createTestDb();
    const env = readEnv({
      NODE_ENV: 'test',
      DATABASE_URL: testDb.url,
      BETTER_AUTH_SECRET: 'a'.repeat(32),
      AUTH_RATE_LIMIT_MAX: '30',
    });
    app = await buildServer(createDeps(env));
  });
  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('sign-up creates a user and sets a session cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Mara', email: 'mara@example.com', password: 'hunter2hunter2' },
    });
    expect(res.statusCode).toBe(200);
    expect(cookieOf(res)).toContain('better-auth');
  });

  it('rejects passwords shorter than 8', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Shorty', email: 'short@example.com', password: 'short' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('sign-in with valid credentials returns a session; wrong password does not', async () => {
    const ok = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'mara@example.com', password: 'hunter2hunter2' },
    });
    expect(ok.statusCode).toBe(200);
    const cookie = cookieOf(ok);

    const session = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie },
    });
    expect(session.statusCode).toBe(200);
    const body = session.json<{ user?: { email?: string } } | null>();
    expect(body?.user?.email).toBe('mara@example.com');

    const bad = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'mara@example.com', password: 'wrong-password' },
    });
    expect(bad.statusCode).toBe(401);
  });

  it('get-session without a cookie is null', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/get-session' });
    expect(res.json()).toBeNull();
  });

  it('sign-out invalidates the session', async () => {
    const signin = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'mara@example.com', password: 'hunter2hunter2' },
    });
    const cookie = cookieOf(signin);
    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      headers: { cookie },
      payload: {},
    });
    const after = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie },
    });
    expect(after.json()).toBeNull();
  });

  it('unconfigured social provider fails with 4xx, not 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/social',
      payload: { provider: 'google', callbackURL: 'http://localhost:3000/home' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});
