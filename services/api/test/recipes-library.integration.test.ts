import type { AIRecipe, GenerationEvent } from '@pantry/contracts';
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

function recipeBody(overrides: Partial<AIRecipe> = {}): AIRecipe {
  return {
    title: 'Charred Scallion Rice',
    summary: 'Fast skillet rice.',
    weirdnessScore: 40,
    ingredients: [{ name: 'Rice', quantity: 2, unit: 'cup', optional: false, note: null }],
    steps: [{ text: 'Fry the rice.' }],
    timeMinutes: 15,
    difficulty: 'easy',
    substitutions: [],
    pantryItemsUsed: ['rice'],
    confidence: 0.8,
    caveats: [],
    whySuggested: 'Uses pantry staples.',
    observation: null,
    ...overrides,
  };
}

const noStream: AiStreamClient = {
  streamGeneration: async function* () {
    await Promise.resolve();
    for (const e of [] as GenerationEvent[]) yield e;
  },
};

describe('recipes library', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let userA: string;
  let userB: string;

  const env = () => readEnv({ NODE_ENV: 'test', DATABASE_URL: testDb.url, BETTER_AUTH_SECRET: 'a'.repeat(32) });

  function callerFor(session: Context['session']) {
    const deps = createDeps(env(), { aiStream: noStream });
    const ctx: Context = { db: testDb.db, session, aiClient: deps.aiClient, aiStream: noStream, requestId: 'test-req' };
    return appRouter.createCaller(ctx);
  }

  const fakeSession = (uid: string): Context['session'] =>
    ({ user: { id: uid }, session: { id: 's', userId: uid } }) as unknown as Context['session'];

  async function userIdFor(email: string): Promise<string> {
    const [row] = await testDb.db.select().from(users).where(eq(users.email, email));
    return row?.id ?? '';
  }

  async function insertRecipe(uid: string, body: AIRecipe, prompt = 'rice please'): Promise<string> {
    const [row] = await testDb.db
      .insert(recipes)
      .values({ userId: uid, prompt, weirdness: body.weirdnessScore, title: body.title, summary: body.summary, data: body })
      .returning();
    return row?.id ?? '';
  }

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(createDeps(env()));
    expect((await signUp(app, { name: 'Aly', email: 'liba@example.com', password: 'hunter2hunter2' })).statusCode).toBe(200);
    expect((await signUp(app, { name: 'Bex', email: 'libb@example.com', password: 'hunter2hunter2' })).statusCode).toBe(200);
    userA = await userIdFor('liba@example.com');
    userB = await userIdFor('libb@example.com');
    expect(userA).toBeTruthy();
    expect(userB).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it("lists only the caller's recipes, newest first, deriving fields from data", async () => {
    const first = await insertRecipe(userA, recipeBody({ title: 'First' }));
    // ensure a distinct createdAt ordering
    await new Promise((r) => setTimeout(r, 10));
    const second = await insertRecipe(userA, recipeBody({ title: 'Second', timeMinutes: 30, difficulty: 'hard', pantryItemsUsed: ['eggs'] }));
    await insertRecipe(userB, recipeBody({ title: 'Other user' }));

    const list = await callerFor(fakeSession(userA)).recipes.list({});
    const ids = list.map((r) => r.id);
    expect(ids).toContain(first);
    expect(ids).toContain(second);
    expect(list.every((r) => r.title !== 'Other user')).toBe(true);
    // newest first
    expect(list[0]?.id).toBe(second);
    const secondItem = list.find((r) => r.id === second);
    expect(secondItem).toMatchObject({ timeMinutes: 30, difficulty: 'hard', pantryItemsUsed: ['eggs'], favorited: false });
  });

  it('favorites are idempotent and filterable', async () => {
    const id = await insertRecipe(userA, recipeBody({ title: 'Favable' }));
    const caller = callerFor(fakeSession(userA));

    await caller.recipes.setFavorite({ recipeId: id, favorited: true });
    await caller.recipes.setFavorite({ recipeId: id, favorited: true }); // idempotent — no PK violation

    const favs = await caller.recipes.list({ filter: 'favorites' });
    expect(favs.filter((r) => r.id === id)).toHaveLength(1);
    expect(favs.find((r) => r.id === id)?.favorited).toBe(true);

    await caller.recipes.setFavorite({ recipeId: id, favorited: false });
    const favsAfter = await caller.recipes.list({ filter: 'favorites' });
    expect(favsAfter.find((r) => r.id === id)).toBeUndefined();
  });

  it('byId returns detail with favorited and 404s across users', async () => {
    const id = await insertRecipe(userA, recipeBody({ title: 'Detailable' }));
    const caller = callerFor(fakeSession(userA));

    const detail = await caller.recipes.byId({ recipeId: id });
    expect(detail.title).toBe('Detailable');
    expect(detail.id).toBe(id);
    expect(detail.favorited).toBe(false);
    expect(detail.steps).toEqual([{ text: 'Fry the rice.' }]);

    await caller.recipes.setFavorite({ recipeId: id, favorited: true });
    expect((await caller.recipes.byId({ recipeId: id })).favorited).toBe(true);

    await expect(callerFor(fakeSession(userB)).recipes.byId({ recipeId: id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(callerFor(fakeSession(userB)).recipes.setFavorite({ recipeId: id, favorited: true })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('rejects unauthenticated callers', async () => {
    const anon = callerFor(null);
    const someId = '123e4567-e89b-12d3-a456-426614174000';
    await expect(anon.recipes.list({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(anon.recipes.byId({ recipeId: someId })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(anon.recipes.setFavorite({ recipeId: someId, favorited: true })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
