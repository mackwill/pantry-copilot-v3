import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';
import { cookieOf } from './helpers/cookie.js';
import { signUp } from './helpers/auth.js';

interface PrefData {
  result: { data: { json: { diet: string[]; allergies: string[] } } };
}

describe('trpc user.preferences', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let cookie: string;

  const mutate = (path: string, input: unknown) =>
    app.inject({
      method: 'POST',
      url: `/trpc/${path}`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { json: input },
    });

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
    const signup = await signUp(app, {
      name: 'Mara',
      email: 'mara@example.com',
      password: 'hunter2hunter2',
    });
    expect(signup.statusCode).toBe(200);
    cookie = cookieOf(signup);
  });
  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('defaults to empty preferences for a new user', async () => {
    const res = await app.inject({ method: 'GET', url: '/trpc/user.preferences', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as PrefData;
    expect(body.result.data.json).toEqual({ diet: [], allergies: [] });
  });

  it('persists updated diet + allergies and reads them back', async () => {
    const update = await mutate('user.updatePreferences', {
      diet: ['keto', 'low_carb'],
      allergies: ['peanuts'],
    });
    expect(update.statusCode).toBe(200);

    const res = await app.inject({ method: 'GET', url: '/trpc/user.preferences', headers: { cookie } });
    const body = JSON.parse(res.body) as PrefData;
    expect(body.result.data.json).toEqual({ diet: ['keto', 'low_carb'], allergies: ['peanuts'] });
  });

  it('overwrites preferences on a subsequent update (upsert)', async () => {
    await mutate('user.updatePreferences', { diet: ['vegan'], allergies: [] });
    const res = await app.inject({ method: 'GET', url: '/trpc/user.preferences', headers: { cookie } });
    const body = JSON.parse(res.body) as PrefData;
    expect(body.result.data.json).toEqual({ diet: ['vegan'], allergies: [] });
  });

  it('is UNAUTHORIZED without a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/trpc/user.preferences' });
    expect(res.statusCode).toBe(401);
  });
});
