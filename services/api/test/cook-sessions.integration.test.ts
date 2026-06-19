import type { AIRecipe, GenerationEvent, PantryUnit, RecipeTweakEvent } from '@pantry/contracts';
import { and, eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cookSessions, inventoryEvents, pantryItems, recipes, users } from '../src/db/schema/index.js';
import { readEnv } from '../src/env.js';
import type { AiStreamClient } from '../src/lib/ai-stream-client.js';
import { buildServer, createDeps } from '../src/server.js';
import type { Context } from '../src/trpc/context.js';
import { appRouter } from '../src/trpc/router.js';
import { signUp } from './helpers/auth.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

function recipeBody(steps: AIRecipe['steps'], overrides: Partial<AIRecipe> = {}): AIRecipe {
  return {
    title: 'Charred Scallion Rice',
    summary: 'Fast skillet rice.',
    weirdnessScore: 40,
    ingredients: [{ name: 'Rice', quantity: 2, unit: 'cup', optional: false, note: null }],
    steps,
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

const THREE_STEPS: AIRecipe['steps'] = [
  { text: 'Melt butter.', label: 'melt', durationMinutes: 2 },
  { text: 'Add rice and toss.', label: 'toss' },
  { text: 'Finish with soy.', label: 'finish' },
];

const noStream: AiStreamClient = {
  streamGeneration: async function* () {
    await Promise.resolve();
    for (const e of [] as GenerationEvent[]) yield e;
  },
  streamTweak: async function* () {
    await Promise.resolve();
    for (const e of [] as RecipeTweakEvent[]) yield e;
  },
};

describe('cook sessions', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let userA: string;
  let userB: string;

  const env = () => readEnv({ NODE_ENV: 'test', DATABASE_URL: testDb.url, BETTER_AUTH_SECRET: 'a'.repeat(32) });

  function callerFor(session: Context['session']) {
    const deps = createDeps(env(), { aiStream: noStream });
    const ctx: Context = { db: testDb.db, env: env(), session, aiClient: deps.aiClient, aiStream: noStream, requestId: 'test-req' };
    return appRouter.createCaller(ctx);
  }

  const fakeSession = (uid: string): Context['session'] =>
    ({ user: { id: uid }, session: { id: 's', userId: uid } }) as unknown as Context['session'];

  async function userIdFor(email: string): Promise<string> {
    const [row] = await testDb.db.select().from(users).where(eq(users.email, email));
    return row?.id ?? '';
  }

  async function insertRecipe(uid: string, steps: AIRecipe['steps'] = THREE_STEPS): Promise<string> {
    const body = recipeBody(steps);
    const [row] = await testDb.db
      .insert(recipes)
      .values({ userId: uid, prompt: 'rice please', weirdness: body.weirdnessScore, title: body.title, summary: body.summary, data: body })
      .returning();
    return row?.id ?? '';
  }

  async function insertPantryItem(uid: string, name: string, quantity: number, unit: PantryUnit = 'cup'): Promise<string> {
    const [row] = await testDb.db
      .insert(pantryItems)
      .values({ userId: uid, name, quantity: String(quantity), unit, category: 'pantry', location: 'pantry_upper' })
      .returning();
    return row?.id ?? '';
  }

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(createDeps(env()));
    expect((await signUp(app, { name: 'Aly', email: 'cooka@example.com', password: 'hunter2hunter2' })).statusCode).toBe(200);
    expect((await signUp(app, { name: 'Bex', email: 'cookb@example.com', password: 'hunter2hunter2' })).statusCode).toBe(200);
    userA = await userIdFor('cooka@example.com');
    userB = await userIdFor('cookb@example.com');
    expect(userA).toBeTruthy();
    expect(userB).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('starts a session with totalSteps from the recipe and only one active per user', async () => {
    const recipeId = await insertRecipe(userA);
    const caller = callerFor(fakeSession(userA));

    const first = await caller.cook.start({ recipeId });
    expect(first.status).toBe('active');
    expect(first.totalSteps).toBe(3);
    expect(first.currentStepIndex).toBe(0);
    expect(first.recipeTitle).toBe('Charred Scallion Rice');

    // Starting again abandons the prior active session (single-active invariant).
    const second = await caller.cook.start({ recipeId });
    expect(second.id).not.toBe(first.id);

    const active = await caller.cook.getActive();
    expect(active?.id).toBe(second.id);

    const [oldRow] = await testDb.db.select().from(cookSessions).where(eq(cookSessions.id, first.id));
    expect(oldRow?.status).toBe('abandoned');
  });

  it('advances the step (clamped) and resumes via getActive', async () => {
    const recipeId = await insertRecipe(userA);
    const caller = callerFor(fakeSession(userA));
    const session = await caller.cook.start({ recipeId });

    const advanced = await caller.cook.advanceStep({ sessionId: session.id, stepIndex: 1 });
    expect(advanced.currentStepIndex).toBe(1);

    // Over-shooting the last step clamps to totalSteps - 1.
    const clamped = await caller.cook.advanceStep({ sessionId: session.id, stepIndex: 99 });
    expect(clamped.currentStepIndex).toBe(2);

    const resumed = await caller.cook.getActive();
    expect(resumed?.id).toBe(session.id);
    expect(resumed?.currentStepIndex).toBe(2);
  });

  it('getActive returns null when there is no active session, after abandon', async () => {
    const recipeId = await insertRecipe(userB);
    const caller = callerFor(fakeSession(userB));
    const session = await caller.cook.start({ recipeId });
    expect(await caller.cook.getActive()).not.toBeNull();

    await caller.cook.abandon({ sessionId: session.id });
    expect(await caller.cook.getActive()).toBeNull();
  });

  it('consume deducts pantry, removes used-up items, writes consumed events, completes the session — atomically', async () => {
    const recipeId = await insertRecipe(userA);
    const caller = callerFor(fakeSession(userA));
    const session = await caller.cook.start({ recipeId });

    const riceId = await insertPantryItem(userA, 'Rice', 3);
    const butterId = await insertPantryItem(userA, 'Butter', 1);

    const result = await caller.cook.consume({
      sessionId: session.id,
      items: [
        { pantryItemId: riceId, quantityUsed: 1, unit: 'cup', finished: false },
        { pantryItemId: butterId, quantityUsed: 1, unit: 'cup', finished: true },
      ],
    });
    expect(result).toMatchObject({ sessionId: session.id, itemsConsumed: 2, itemsRemoved: 1 });

    // Partial item reduced.
    const [rice] = await testDb.db.select().from(pantryItems).where(eq(pantryItems.id, riceId));
    expect(Number(rice?.quantity)).toBe(2);
    // Used-up item removed.
    const [butter] = await testDb.db.select().from(pantryItems).where(eq(pantryItems.id, butterId));
    expect(butter).toBeUndefined();

    // A consumed event was written per item (the removed item's survives via set-null).
    const events = await testDb.db
      .select()
      .from(inventoryEvents)
      .where(and(eq(inventoryEvents.userId, userA), eq(inventoryEvents.kind, 'consumed')));
    expect(events).toHaveLength(2);

    // Session is completed and no longer resumable.
    const [completed] = await testDb.db.select().from(cookSessions).where(eq(cookSessions.id, session.id));
    expect(completed?.status).toBe('completed');
    expect(completed?.completedAt).not.toBeNull();
  });

  it('rolls back the whole consume when one item is not the caller’s', async () => {
    const recipeId = await insertRecipe(userA);
    const caller = callerFor(fakeSession(userA));
    const session = await caller.cook.start({ recipeId });
    const mine = await insertPantryItem(userA, 'Onion', 5);
    const theirs = await insertPantryItem(userB, 'Secret', 5);

    await expect(
      caller.cook.consume({
        sessionId: session.id,
        items: [
          { pantryItemId: mine, quantityUsed: 2, unit: 'cup', finished: false },
          { pantryItemId: theirs, quantityUsed: 2, unit: 'cup', finished: false },
        ],
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    // The transaction rolled back: my item is untouched and the session stays active.
    const [onion] = await testDb.db.select().from(pantryItems).where(eq(pantryItems.id, mine));
    expect(Number(onion?.quantity)).toBe(5);
    const [stillActive] = await testDb.db.select().from(cookSessions).where(eq(cookSessions.id, session.id));
    expect(stillActive?.status).toBe('active');
  });

  it('404s when starting another user’s recipe or touching another user’s session', async () => {
    const recipeId = await insertRecipe(userA);
    await expect(callerFor(fakeSession(userB)).cook.start({ recipeId })).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const session = await callerFor(fakeSession(userA)).cook.start({ recipeId });
    await expect(
      callerFor(fakeSession(userB)).cook.advanceStep({ sessionId: session.id, stepIndex: 1 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(callerFor(fakeSession(userB)).cook.abandon({ sessionId: session.id })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('rejects unauthenticated callers', async () => {
    const anon = callerFor(null);
    const someId = '123e4567-e89b-12d3-a456-426614174000';
    await expect(anon.cook.getActive()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(anon.cook.start({ recipeId: someId })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(anon.cook.consume({ sessionId: someId, items: [] })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
