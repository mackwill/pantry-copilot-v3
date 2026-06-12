import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

describe('trpc user.me', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let cookie: string;

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(
      createDeps(
        readEnv({
          NODE_ENV: 'test',
          DATABASE_URL: testDb.url,
          BETTER_AUTH_SECRET: 'a'.repeat(32),
        }),
      ),
    );
    const signup = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Mara', email: 'mara@example.com', password: 'hunter2hunter2' },
    });
    const raw = signup.headers['set-cookie'];
    const arr = Array.isArray(raw) ? raw : [raw];
    cookie = arr
      .filter((c): c is string => typeof c === 'string')
      .map((c) => c.split(';')[0] ?? '')
      .join('; ');
  });
  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('returns the authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/trpc/user.me',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('mara@example.com');
  });

  it('is UNAUTHORIZED without a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/trpc/user.me' });
    expect(res.statusCode).toBe(401);
  });
});
