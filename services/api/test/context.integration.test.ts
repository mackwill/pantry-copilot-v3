import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readEnv } from '../src/env.js';
import { createDeps } from '../src/server.js';
import { createContextFactory } from '../src/trpc/context.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

describe('trpc context', () => {
  let testDb: TestDb;

  const env = () => readEnv({ NODE_ENV: 'test', DATABASE_URL: testDb.url, BETTER_AUTH_SECRET: 'a'.repeat(32) });

  beforeAll(async () => {
    testDb = await createTestDb();
  });

  afterAll(async () => {
    await testDb.drop();
  });

  it('exposes env on the produced context', async () => {
    const deps = createDeps(env());
    const ctx = await createContextFactory(deps)({
      req: { headers: {}, id: 'test-req' },
    } as unknown as CreateFastifyContextOptions);
    expect(ctx.env).toBe(deps.env);
    expect(ctx.env.NODE_ENV).toBe('test');
    await deps.pool.end();
  });
});
