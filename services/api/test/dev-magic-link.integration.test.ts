import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { cookieOf } from './helpers/cookie.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

describe('dev magic link', () => {
  let testDb: TestDb;
  let enabled: FastifyInstance;
  let disabled: FastifyInstance;

  beforeAll(async () => {
    testDb = await createTestDb();
    const base = {
      NODE_ENV: 'test',
      DATABASE_URL: testDb.url,
      BETTER_AUTH_SECRET: 'a'.repeat(32),
    };
    enabled = await buildServer(createDeps(readEnv({ ...base, AUTH_DEV_MAGIC_LINK: 'true' })));
    disabled = await buildServer(createDeps(readEnv(base)));
  });
  afterAll(async () => {
    await enabled.close();
    await disabled.close();
    await testDb.drop();
  });

  it('returns a magic-link url that establishes a session', async () => {
    const res = await enabled.inject({
      method: 'POST',
      url: '/api/dev/magic-link',
      payload: { email: 'dev@example.com' },
    });
    expect(res.statusCode).toBe(200);
    const { url } = res.json<{ url: string }>();
    expect(url).toContain('/api/auth/');

    const link = new URL(url);
    const follow = await enabled.inject({
      method: 'GET',
      url: link.pathname + link.search,
    });
    const cookie = cookieOf(follow);
    const session = await enabled.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie },
    });
    const body = session.json<{ user?: { email?: string } } | null>();
    expect(body?.user?.email).toBe('dev@example.com');
  });

  it('is absent when the flag is off', async () => {
    const res = await disabled.inject({
      method: 'POST',
      url: '/api/dev/magic-link',
      payload: { email: 'dev@example.com' },
    });
    expect(res.statusCode).toBe(404);
  });
});
