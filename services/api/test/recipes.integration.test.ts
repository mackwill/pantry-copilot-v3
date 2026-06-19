import type { AIRecipe, GenerationEvent, RecipeTweakEvent } from '@pantry/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recipeGenerationJobs, recipes, users } from '../src/db/schema/index.js';
import { readEnv } from '../src/env.js';
import type { AiStreamClient } from '../src/lib/ai-stream-client.js';
import { buildServer, createDeps } from '../src/server.js';
import { appRouter } from '../src/trpc/router.js';
import type { Context } from '../src/trpc/context.js';
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
  { type: 'thinking_token', text: 'thinking...', seq: 1, t: 1 },
  { type: 'recipe_partial', recipe: { title: 'Charred Scallion Rice' }, complete: false, seq: 2, t: 2 },
  { type: 'done', recipe: RECIPE, recipeId: null, seq: 3, t: 3 },
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

describe('trpc recipes.generateStream', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let userId: string;

  const env = () => readEnv({ NODE_ENV: 'test', DATABASE_URL: testDb.url, BETTER_AUTH_SECRET: 'a'.repeat(32) });

  function callerFor(stream: AiStreamClient, session: Context['session']) {
    const deps = createDeps(env(), { aiStream: stream });
    const ctx: Context = { db: testDb.db, env: env(), session, aiClient: deps.aiClient, aiStream: stream, requestId: 'test-req' };
    return appRouter.createCaller(ctx);
  }

  const fakeSession = (uid: string): Context['session'] =>
    ({ user: { id: uid }, session: { id: 's', userId: uid } }) as unknown as Context['session'];

  async function drain(stream: AiStreamClient, uid = userId): Promise<GenerationEvent[]> {
    const caller = callerFor(stream, fakeSession(uid));
    const out: GenerationEvent[] = [];
    for await (const e of await caller.recipes.generateStream({ prompt: 'rice please', weirdness: 40, pantryItemIds: [] })) {
      out.push(e);
    }
    return out;
  }

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(createDeps(env()));
    const signup = await signUp(app, { name: 'Rhea', email: 'recipes@example.com', password: 'hunter2hunter2' });
    expect(signup.statusCode).toBe(200);
    const [row] = await testDb.db.select().from(users).where(eq(users.email, 'recipes@example.com'));
    userId = row?.id ?? '';
    expect(userId).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('flows events through and persists exactly one recipe with a real id on done', async () => {
    const events = await drain(tapeStream(TAPE));
    expect(events[0]?.type).toBe('pulling_from');
    const done = events.at(-1);
    expect(done?.type).toBe('done');
    const recipeId = done?.type === 'done' ? done.recipeId : null;
    expect(recipeId).toMatch(/^[0-9a-f-]{36}$/);

    const rows = await testDb.db.select().from(recipes).where(eq(recipes.userId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(recipeId);
    expect(rows[0]?.title).toBe('Charred Scallion Rice');

    const [job] = await testDb.db.select().from(recipeGenerationJobs).where(eq(recipeGenerationJobs.recipeId, recipeId ?? ''));
    expect(job?.status).toBe('succeeded');
  });

  it('is UNAUTHORIZED without a session', async () => {
    const caller = callerFor(tapeStream(TAPE), null);
    await expect(caller.recipes.generateStream({ prompt: 'x', weirdness: 10, pantryItemIds: [] })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('marks the job aborted and writes no recipe when the subscriber unsubscribes early', async () => {
    const caller = callerFor(tapeStream(TAPE), fakeSession(userId));
    const before = (await testDb.db.select().from(recipes).where(eq(recipes.userId, userId))).length;
    for await (const e of await caller.recipes.generateStream({ prompt: 'stop early', weirdness: 10, pantryItemIds: [] })) {
      if (e.type === 'thinking_token') break; // unsubscribe before done
    }
    const after = await testDb.db.select().from(recipes).where(eq(recipes.userId, userId));
    expect(after).toHaveLength(before);
    const [job] = await testDb.db.select().from(recipeGenerationJobs).where(eq(recipeGenerationJobs.status, 'aborted'));
    expect(job?.status).toBe('aborted');
  });
});
