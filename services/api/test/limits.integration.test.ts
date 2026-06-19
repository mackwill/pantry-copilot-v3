import type { AIRecipe } from '@pantry/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { TRPCError } from '@trpc/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recipes, topUpCreditConsumptions, topUpCreditGrants, users } from '../src/db/schema/index.js';
import { readEnv, type Env } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { assertAiActionAllowed, getAiQuotaState } from '../src/modules/subscription/limits.js';
import { signUp } from './helpers/auth.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

const RECIPE: AIRecipe = {
  title: 'Test Rice',
  summary: 'Fast rice.',
  weirdnessScore: 40,
  ingredients: [{ name: 'Rice', quantity: 2, unit: 'cup', optional: false, note: null }],
  steps: [{ text: 'Cook.' }],
  timeMinutes: 15,
  difficulty: 'easy',
  substitutions: [],
  pantryItemsUsed: [],
  confidence: 0.8,
  caveats: [],
  whySuggested: 'Pantry staples.',
  observation: null,
};

async function insertAiRecipe(
  db: TestDb['db'],
  userId: string,
  createdAt: Date,
): Promise<void> {
  await db.insert(recipes).values({
    userId,
    prompt: 'rice',
    source: 'ai',
    weirdness: 40,
    title: 'Test Rice',
    data: RECIPE,
    createdAt,
  });
}

describe('subscription quota limits (weekly window)', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let userId: string;
  // Mid-week so "8 days ago" lands in the previous week regardless of weekday.
  const now = new Date('2026-06-17T12:00:00Z'); // Wednesday
  const env: Env = readEnv({ NODE_ENV: 'test', DATABASE_URL: 'postgres://x', BETTER_AUTH_SECRET: 'a'.repeat(32) });

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(createDeps(readEnv({ NODE_ENV: 'test', DATABASE_URL: testDb.url, BETTER_AUTH_SECRET: 'a'.repeat(32) })));
    const signup = await signUp(app, { name: 'Q', email: 'quota@example.com', password: 'hunter2hunter2' });
    expect(signup.statusCode).toBe(200);
    const [row] = await testDb.db.select().from(users).where(eq(users.email, 'quota@example.com'));
    userId = row?.id ?? '';
    expect(userId).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('free user with 0 used has the full weekly recipe allowance', async () => {
    const state = await getAiQuotaState(testDb.db, userId, 'recipe', env, now);
    expect(state.tier).toBe('free');
    expect(state.tierLimit).toBe(3);
    expect(state.remaining).toBe(3);
    expect(state.allowed).toBe(true);
    expect(state.used).toBe(0);
  });

  it('a recipe dated last week does not count against this week', async () => {
    const lastWeek = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    await insertAiRecipe(testDb.db, userId, lastWeek);
    const state = await getAiQuotaState(testDb.db, userId, 'recipe', env, now);
    expect(state.used).toBe(0);
    expect(state.remaining).toBe(3);
    expect(state.allowed).toBe(true);
  });

  it('exhausts the allowance after 3 AI recipes this week', async () => {
    for (let i = 0; i < 3; i += 1) {
      await insertAiRecipe(testDb.db, userId, now);
    }
    const state = await getAiQuotaState(testDb.db, userId, 'recipe', env, now);
    expect(state.used).toBe(3);
    expect(state.remaining).toBe(0);
    expect(state.allowed).toBe(false);
  });

  it('assertAiActionAllowed throws FORBIDDEN / limit_reached when exhausted', async () => {
    let thrown: unknown;
    try {
      await assertAiActionAllowed(testDb.db, userId, 'recipe', env, now);
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(TRPCError);
    const trpc = thrown as TRPCError;
    expect(trpc.code).toBe('FORBIDDEN');
    expect(trpc.message).toBe('limit_reached');
    // TRPCError coerces a non-Error `cause` into an Error wrapping the
    // string; tRPC's error formatter serialises that to `data.cause`.
    expect(trpc.cause instanceof Error ? trpc.cause.message : trpc.cause).toBe(
      'limit_reached',
    );
  });

  it('top-up credits let an exhausted user through and burn a credit', async () => {
    await testDb.db.insert(topUpCreditGrants).values({
      userId,
      sourceEventId: 'evt_topup_1',
      amount: 2,
      productIdentifier: 'topup_pack',
    });

    const before = await getAiQuotaState(testDb.db, userId, 'recipe', env, now);
    expect(before.topUpBonus).toBe(2);
    expect(before.allowed).toBe(true);

    const state = await assertAiActionAllowed(testDb.db, userId, 'recipe', env, now);
    expect(state.allowed).toBe(true);

    const consumptions = await testDb.db
      .select()
      .from(topUpCreditConsumptions)
      .where(eq(topUpCreditConsumptions.userId, userId));
    expect(consumptions).toHaveLength(1);
    expect(consumptions[0]?.actionKind).toBe('recipe');
  });
});
