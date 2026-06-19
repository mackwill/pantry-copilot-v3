import { type AIRecipe, type GenerationEvent, type RecipeTweakEvent, SubscriptionState, UsageState } from '@pantry/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recipes, users } from '../src/db/schema/index.js';
import { readEnv } from '../src/env.js';
import type { AiStreamClient } from '../src/lib/ai-stream-client.js';
import { buildServer, createDeps } from '../src/server.js';
import type { Context } from '../src/trpc/context.js';
import { appRouter } from '../src/trpc/router.js';
import { signUp } from './helpers/auth.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

const RECIPE: AIRecipe = {
  title: 'Charred Scallion Rice',
  summary: 'Fast skillet rice.',
  weirdnessScore: 40,
  ingredients: [{ name: 'Rice', quantity: 2, unit: 'cup', optional: false, note: null }],
  steps: [{ text: 'Fry the rice.' }],
  timeMinutes: 15,
  difficulty: 'easy',
  substitutions: [],
  pantryItemsUsed: [],
  confidence: 0.8,
  caveats: [],
  whySuggested: 'Uses pantry staples.',
  observation: null,
};

const TAPE: GenerationEvent[] = [
  { type: 'pulling_from', must: [], maybe: [], seq: 0, t: 0 },
  { type: 'done', recipe: RECIPE, recipeId: null, seq: 1, t: 1 },
];

function tapeStream(events: GenerationEvent[]): AiStreamClient {
  return {
    streamGeneration: async function* () {
      await Promise.resolve();
      for (const e of events) yield e;
    },
    streamTweak: async function* () {
      await Promise.resolve();
      for (const e of [] as RecipeTweakEvent[]) yield e;
    },
  };
}

describe('trpc subscription', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let userId: string;

  const env = () => readEnv({ NODE_ENV: 'test', DATABASE_URL: testDb.url, BETTER_AUTH_SECRET: 'a'.repeat(32) });

  function callerFor(session: Context['session'], stream: AiStreamClient = tapeStream(TAPE)) {
    const deps = createDeps(env(), { aiStream: stream });
    const ctx: Context = { db: testDb.db, env: env(), session, aiClient: deps.aiClient, aiStream: stream, requestId: 'test-req' };
    return appRouter.createCaller(ctx);
  }

  const fakeSession = (uid: string): Context['session'] =>
    ({ user: { id: uid }, session: { id: 's', userId: uid } }) as unknown as Context['session'];

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(createDeps(env()));
    const signup = await signUp(app, { name: 'Sub', email: 'sub@example.com', password: 'hunter2hunter2' });
    expect(signup.statusCode).toBe(200);
    const [row] = await testDb.db.select().from(users).where(eq(users.email, 'sub@example.com'));
    userId = row?.id ?? '';
    expect(userId).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('get returns free defaults for a fresh user and parses against SubscriptionState', async () => {
    const caller = callerFor(fakeSession(userId));
    const result = await caller.subscription.get();
    expect(result).toMatchObject({
      tier: 'free',
      isPro: false,
      subState: 'none',
      expiresAt: null,
      topUpCredits: 0,
    });
    expect(() => SubscriptionState.parse(result)).not.toThrow();
  });

  it('usage returns { recipes, scans } with free tier limits and parses against UsageState', async () => {
    const caller = callerFor(fakeSession(userId));
    const result = await caller.subscription.usage();
    expect(() => UsageState.parse(result.recipes)).not.toThrow();
    expect(() => UsageState.parse(result.scans)).not.toThrow();
    expect(result.recipes.kind).toBe('recipe');
    expect(result.recipes.tierLimit).toBe(3);
    expect(result.scans.kind).toBe('scan');
    expect(result.scans.tierLimit).toBe(2);
  });

  it('generateStream throws limit_reached once the weekly free recipe count is exhausted', async () => {
    const now = new Date();
    for (let i = 0; i < 3; i += 1) {
      await testDb.db.insert(recipes).values({
        userId,
        prompt: `seed ${String(i)}`,
        source: 'ai',
        weirdness: 40,
        title: `Seed ${String(i)}`,
        summary: null,
        data: RECIPE,
        createdAt: now,
      });
    }

    const caller = callerFor(fakeSession(userId));
    await expect(
      (async () => {
        const stream = await caller.recipes.generateStream({ prompt: 'one more', weirdness: 40, pantryItemIds: [] });
        // Driving the generator: the gate must throw on the first pull,
        // before any event is produced or a job row is created.
        await stream[Symbol.asyncIterator]().next();
      })(),
    ).rejects.toMatchObject({ message: 'limit_reached', cause: { message: 'limit_reached' } });
  });
});
