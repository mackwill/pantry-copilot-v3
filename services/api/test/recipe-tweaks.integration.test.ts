import type { AIRecipe, GenerationEvent, RecipeTweakEvent } from '@pantry/contracts';
import { asc, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recipeTweaks, recipes, users } from '../src/db/schema/index.js';
import { readEnv } from '../src/env.js';
import type { AiStreamClient } from '../src/lib/ai-stream-client.js';
import { buildServer, createDeps } from '../src/server.js';
import type { Context } from '../src/trpc/context.js';
import { appRouter } from '../src/trpc/router.js';
import { signUp } from './helpers/auth.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

const ORIGINAL: AIRecipe = {
  title: 'Charred Scallion Fried Rice',
  summary: 'Fast skillet rice.',
  weirdnessScore: 40,
  ingredients: [
    { name: 'Cooked rice', quantity: 3, unit: 'cup', optional: false, note: 'day-old' },
    { name: 'Butter', quantity: 2, unit: 'tbsp', optional: false, note: null },
  ],
  steps: [{ text: 'Crisp the rice.' }],
  timeMinutes: 20,
  difficulty: 'easy',
  substitutions: [],
  pantryItemsUsed: [],
  confidence: 0.8,
  caveats: [],
  whySuggested: 'Uses pantry staples.',
  observation: null,
};

function tweakedRecipe(title: string): AIRecipe {
  return {
    ...ORIGINAL,
    title,
    ingredients: [
      { name: 'Cooked rice', quantity: 3, unit: 'cup', optional: false, note: 'day-old' },
      { name: 'Butter', quantity: 1, unit: 'tsp', optional: false, note: null, edited: true },
      { name: 'Baby spinach', quantity: 2, unit: 'cup', optional: false, note: 'chopped', added: true },
    ],
  };
}

function tweakTape(summary: string, recipe: AIRecipe): RecipeTweakEvent[] {
  return [
    { type: 'tweak_summary', text: summary, seq: 0, t: 0 },
    { type: 'tweak_recipe_partial', recipe: { title: recipe.title }, complete: false, seq: 1, t: 1 },
    {
      type: 'tweak_done',
      response: { summary, changes: [{ tag: 'add', text: 'Added spinach' }], updatedRecipe: recipe },
      recipeId: null,
      turn: 0,
      version: 1,
      seq: 2,
      t: 2,
    },
  ];
}

function tapeStream(events: RecipeTweakEvent[]): AiStreamClient {
  return {
    streamGeneration: async function* () {
      await Promise.resolve();
      for (const e of [] as GenerationEvent[]) yield e;
    },
    streamTweak: async function* () {
      await Promise.resolve();
      for (const e of events) yield e;
    },
  };
}

describe('trpc recipes tweak / revert', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let userA: string;
  let userB: string;

  const env = () => readEnv({ NODE_ENV: 'test', DATABASE_URL: testDb.url, BETTER_AUTH_SECRET: 'a'.repeat(32) });

  function callerFor(stream: AiStreamClient, session: Context['session']) {
    const deps = createDeps(env(), { aiStream: stream });
    const ctx: Context = { db: testDb.db, env: env(), session, aiClient: deps.aiClient, aiStream: stream, requestId: 'test-req' };
    return appRouter.createCaller(ctx);
  }

  const fakeSession = (uid: string): Context['session'] =>
    ({ user: { id: uid }, session: { id: 's', userId: uid } }) as unknown as Context['session'];

  async function insertRecipe(uid: string): Promise<string> {
    const [row] = await testDb.db
      .insert(recipes)
      .values({ userId: uid, prompt: 'rice', weirdness: ORIGINAL.weirdnessScore, title: ORIGINAL.title, summary: ORIGINAL.summary, data: ORIGINAL })
      .returning();
    return row?.id ?? '';
  }

  async function drainTweak(stream: AiStreamClient, uid: string, recipeId: string, prompt: string): Promise<RecipeTweakEvent[]> {
    const caller = callerFor(stream, fakeSession(uid));
    const out: RecipeTweakEvent[] = [];
    for await (const e of await caller.recipes.tweakStream({ recipeId, prompt })) out.push(e);
    return out;
  }

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(createDeps(env()));
    expect((await signUp(app, { name: 'Ann', email: 'tweaka@example.com', password: 'hunter2hunter2' })).statusCode).toBe(200);
    expect((await signUp(app, { name: 'Bo', email: 'tweakb@example.com', password: 'hunter2hunter2' })).statusCode).toBe(200);
    const [a] = await testDb.db.select().from(users).where(eq(users.email, 'tweaka@example.com'));
    const [b] = await testDb.db.select().from(users).where(eq(users.email, 'tweakb@example.com'));
    userA = a?.id ?? '';
    userB = b?.id ?? '';
    expect(userA && userB).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('applies a tweak: bumps version, captures the snapshot, writes the turn, re-emits real ids', async () => {
    const recipeId = await insertRecipe(userA);
    const recipe = tweakedRecipe('Greener Fried Rice');
    const events = await drainTweak(tapeStream(tweakTape('Lighter and greener.', recipe)), userA, recipeId, 'more greens');

    const done = events.at(-1);
    expect(done?.type).toBe('tweak_done');
    if (done?.type === 'tweak_done') {
      expect(done.recipeId).toBe(recipeId);
      expect(done.turn).toBe(1);
      expect(done.version).toBe(2);
    }

    const [row] = await testDb.db.select().from(recipes).where(eq(recipes.id, recipeId));
    expect(row?.version).toBe(2);
    expect(row?.data.title).toBe('Greener Fried Rice');
    expect(row?.title).toBe('Greener Fried Rice');
    expect(row?.originalSnapshot?.title).toBe(ORIGINAL.title);

    const turns = await testDb.db.select().from(recipeTweaks).where(eq(recipeTweaks.recipeId, recipeId)).orderBy(asc(recipeTweaks.turn));
    expect(turns).toHaveLength(1);
    expect(turns[0]?.turn).toBe(1);
    expect(turns[0]?.userMessage).toBe('more greens');
    expect(turns[0]?.changes).toEqual([{ tag: 'add', text: 'Added spinach' }]);
  });

  it('keeps the original snapshot frozen across multiple tweaks and exposes version + tweakCount', async () => {
    const recipeId = await insertRecipe(userA);
    await drainTweak(tapeStream(tweakTape('First.', tweakedRecipe('Tweak One'))), userA, recipeId, 'one');
    const second = await drainTweak(tapeStream(tweakTape('Second.', tweakedRecipe('Tweak Two'))), userA, recipeId, 'two');

    const done = second.at(-1);
    expect(done?.type === 'tweak_done' && done.turn).toBe(2);
    expect(done?.type === 'tweak_done' && done.version).toBe(3);

    const [row] = await testDb.db.select().from(recipes).where(eq(recipes.id, recipeId));
    expect(row?.originalSnapshot?.title).toBe(ORIGINAL.title); // still the pre-tweak snapshot

    const caller = callerFor(tapeStream([]), fakeSession(userA));
    const detail = await caller.recipes.byId({ recipeId });
    expect(detail.version).toBe(3);
    expect(detail.tweakCount).toBe(2);
    const thread = await caller.recipes.tweaks({ recipeId });
    expect(thread.map((t) => t.turn)).toEqual([1, 2]);
  });

  it('reverts to the original snapshot and clears the tweak thread', async () => {
    const recipeId = await insertRecipe(userA);
    await drainTweak(tapeStream(tweakTape('Tweaked.', tweakedRecipe('Tweaked Title'))), userA, recipeId, 'change it');

    const caller = callerFor(tapeStream([]), fakeSession(userA));
    const reverted = await caller.recipes.revert({ recipeId });
    expect(reverted.version).toBe(1);
    expect(reverted.title).toBe(ORIGINAL.title);
    expect(reverted.tweakCount).toBe(0);

    const [row] = await testDb.db.select().from(recipes).where(eq(recipes.id, recipeId));
    expect(row?.version).toBe(1);
    expect(row?.data.title).toBe(ORIGINAL.title);
    expect(row?.originalSnapshot).toBeNull();
    const turns = await testDb.db.select().from(recipeTweaks).where(eq(recipeTweaks.recipeId, recipeId));
    expect(turns).toHaveLength(0);
  });

  it('rejects tweaking, reverting, and reading the thread of another user\'s recipe', async () => {
    const recipeId = await insertRecipe(userA);
    const callerB = callerFor(tapeStream(tweakTape('x', tweakedRecipe('Hijack'))), fakeSession(userB));
    await expect(drainTweak(tapeStream(tweakTape('x', tweakedRecipe('Hijack'))), userB, recipeId, 'mine now')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(callerB.recipes.revert({ recipeId })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(callerB.recipes.tweaks({ recipeId })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
