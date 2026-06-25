import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  topUpCreditGrants,
  userSubscriptions,
  users,
} from '../src/db/schema/index.js';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { signUp } from './helpers/auth.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

interface RcEvent {
  id: string;
  type: string;
  app_user_id: string;
  product_id?: string | null;
  expiration_at_ms?: number | null;
  period_type?: string | null;
  store?: string | null;
}

function payload(event: RcEvent): { event: RcEvent; api_version: string } {
  return { event, api_version: '1.0' };
}

describe('POST /webhooks/revenuecat', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let userId: string;

  const env = () =>
    readEnv({
      NODE_ENV: 'test',
      DATABASE_URL: testDb.url,
      BETTER_AUTH_SECRET: 'a'.repeat(32),
      REVENUECAT_WEBHOOK_AUTH: 'test-secret',
    });

  const NO_AUTH = Symbol('no-auth');

  function post(body: object, authorization: string | typeof NO_AUTH = 'test-secret') {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (authorization !== NO_AUTH) headers['authorization'] = authorization;
    return app.inject({ method: 'POST', url: '/webhooks/revenuecat', headers, payload: body });
  }

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(createDeps(env()));
    const signup = await signUp(app, {
      name: 'Hook',
      email: 'hook@example.com',
      password: 'hunter2hunter2',
    });
    expect(signup.statusCode).toBe(200);
    const [row] = await testDb.db.select().from(users).where(eq(users.email, 'hook@example.com'));
    userId = row?.id ?? '';
    expect(userId).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('rejects a missing authorization header with 401', async () => {
    const res = await post(payload({ id: 'evt-noauth', type: 'INITIAL_PURCHASE', app_user_id: userId }), NO_AUTH);
    expect(res.statusCode).toBe(401);
  });

  it('rejects a wrong authorization header with 401', async () => {
    const res = await post(payload({ id: 'evt-wrong', type: 'INITIAL_PURCHASE', app_user_id: userId }), 'nope');
    expect(res.statusCode).toBe(401);
  });

  it('rejects a malformed body with 400', async () => {
    const res = await post({});
    expect(res.statusCode).toBe(400);
  });

  it('flips the user to pro on INITIAL_PURCHASE (event-only mode)', async () => {
    const res = await post(
      payload({ id: 'evt-initial', type: 'INITIAL_PURCHASE', app_user_id: userId, product_id: 'pro_monthly' }),
    );
    expect(res.statusCode).toBe(200);
    const [sub] = await testDb.db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    expect(sub?.tier).toBe('pro');
    expect(sub?.isPro).toBe(true);
  });

  it('treats a replayed event.id as a duplicate no-op', async () => {
    const event = payload({ id: 'evt-dup', type: 'RENEWAL', app_user_id: userId, product_id: 'pro_monthly' });
    const first = await post(event);
    expect(first.statusCode).toBe(200);
    const second = await post(event);
    expect(second.statusCode).toBe(200);
    expect(second.json()).toMatchObject({ duplicate: true });
  });

  it('grants exactly one top-up credit for NON_RENEWING_PURCHASE, idempotent on replay', async () => {
    const event = payload({
      id: 'evt-topup',
      type: 'NON_RENEWING_PURCHASE',
      app_user_id: userId,
      product_id: 'credits_10',
    });
    const first = await post(event);
    expect(first.statusCode).toBe(200);
    const replay = await post(event);
    expect(replay.statusCode).toBe(200);

    const grants = await testDb.db
      .select()
      .from(topUpCreditGrants)
      .where(eq(topUpCreditGrants.userId, userId));
    expect(grants).toHaveLength(1);
  });

  it('acknowledges and ignores an unknown event type', async () => {
    const res = await post(payload({ id: 'evt-unknown', type: 'SOMETHING_NEW', app_user_id: userId }));
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ignored: true });
  });
});
