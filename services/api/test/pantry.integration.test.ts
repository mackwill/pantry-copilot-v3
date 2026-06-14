import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';
import { cookieOf } from './helpers/cookie.js';
import { signUp } from './helpers/auth.js';

const milk = {
  name: 'Whole milk',
  brand: 'Strauss',
  quantity: 0.5,
  unit: 'gallon',
  category: 'dairy',
  location: 'fridge_top',
  purchasedAt: '2026-04-16',
  bestBy: '2026-04-23',
  notes: null,
};

describe('trpc pantry', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let cookie: string;

  const trpc = (path: string, input: unknown) =>
    app.inject({
      method: 'POST',
      url: `/trpc/${path}`,
      headers: { cookie, 'content-type': 'application/json' },
      payload: { json: input },
    });

  const createMilkId = async () => {
    const res = await trpc('pantry.create', milk);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { result: { data: { json: { id: string } } } };
    return body.result.data.json.id;
  };

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
    expect(signup.statusCode, 'signup in beforeAll must succeed').toBe(200);
    cookie = cookieOf(signup);
    expect(cookie, 'cookie must be set after signup').toContain('better-auth');
  });
  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('creates an item and lists it back', async () => {
    const created = await trpc('pantry.create', milk);
    expect(created.statusCode).toBe(200);

    const list = await app.inject({ method: 'GET', url: '/trpc/pantry.list', headers: { cookie } });
    expect(list.statusCode).toBe(200);
    expect(list.body).toContain('Whole milk');
  });

  it('is UNAUTHORIZED without a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/trpc/pantry.list' });
    expect(res.statusCode).toBe(401);
  });

  it('updates an item and writes an edited event', async () => {
    const id = await createMilkId();
    const res = await trpc('pantry.update', { id, quantity: 1, name: 'Skim milk' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('Skim milk');
  });

  it('removes an item', async () => {
    const id = await createMilkId();
    const res = await trpc('pantry.remove', { id });
    expect(res.statusCode).toBe(200);
  });

  it("forbids updating another user's item", async () => {
    const id = await createMilkId();
    const signup = await signUp(app, {
      name: 'X',
      email: 'x@example.com',
      password: 'hunter2hunter2',
    });
    const otherCookie = cookieOf(signup);
    const res = await app.inject({
      method: 'POST',
      url: '/trpc/pantry.update',
      headers: { cookie: otherCookie, 'content-type': 'application/json' },
      payload: { json: { id, name: 'Hax' } },
    });
    expect(res.statusCode).toBe(404);
  });
});
