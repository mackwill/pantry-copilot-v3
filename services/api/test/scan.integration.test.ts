import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AIImageExtractionResponse, CreatePantryItemInput } from '@pantry/contracts';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { imageScans } from '../src/db/schema/index.js';
import { readEnv } from '../src/env.js';
import type { AiClient } from '../src/lib/ai-client.js';
import { buildServer, createDeps } from '../src/server.js';
import { signUp } from './helpers/auth.js';
import { cookieOf } from './helpers/cookie.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

const SAMPLE_JPEG = readFileSync(fileURLToPath(new URL('./fixtures/scan-sample.jpg', import.meta.url))).toString('base64');

const cannedResponse: AIImageExtractionResponse = {
  provider: 'mock',
  model: 'mock-vision',
  result: {
    ingredients: [
      { name: 'Whole milk', normalizedName: 'whole milk', category: 'dairy', location: 'fridge_door', quantity: 0.5, unit: 'gallon', confidence: 0.94, notes: null },
      { name: 'Butter', normalizedName: 'butter', category: 'dairy', location: 'fridge_top', quantity: 1, unit: 'stick', confidence: 0.89, notes: null },
      { name: 'Carrots', normalizedName: 'carrots', category: 'produce', location: 'fridge_crisper', quantity: 3, unit: 'ea', confidence: 0.92, notes: null },
    ],
    duplicatesMerged: [],
    reviewNotes: null,
  },
  tokensUsed: { input: 12, output: 34 },
};

let lastRequestId: string | undefined;
const fakeAiClient: AiClient = {
  extractFromImage: (_req, opts) => {
    lastRequestId = opts.requestId;
    return Promise.resolve(cannedResponse);
  },
};

const milkItem: CreatePantryItemInput = {
  name: 'Whole milk', brand: null, quantity: 0.5, unit: 'gallon', category: 'dairy', location: 'fridge_door', purchasedAt: null, bestBy: null, notes: null,
};
const butterItem: CreatePantryItemInput = {
  name: 'Butter', brand: null, quantity: 1, unit: 'stick', category: 'dairy', location: 'fridge_top', purchasedAt: null, bestBy: null, notes: null,
};

interface TrpcData<T> {
  result: { data: { json: T } };
}

describe('trpc scan', () => {
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

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(
      createDeps(
        readEnv({ NODE_ENV: 'test', DATABASE_URL: testDb.url, BETTER_AUTH_SECRET: 'a'.repeat(32) }),
        { aiClient: fakeAiClient },
      ),
    );
    const signup = await signUp(app, { name: 'Mara', email: 'scan@example.com', password: 'hunter2hunter2' });
    expect(signup.statusCode).toBe(200);
    cookie = cookieOf(signup);
  });

  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  const extractSample = async () => {
    const res = await trpc('scan.extract', { imageBase64: SAMPLE_JPEG, mediaType: 'image/jpeg' });
    expect(res.statusCode).toBe(200);
    return (JSON.parse(res.body) as TrpcData<{ scanId: string; result: { ingredients: unknown[] } }>).result.data.json;
  };

  it('extracts items and persists a succeeded image_scans row', async () => {
    const data = await extractSample();
    expect(data.result.ingredients).toHaveLength(3);
    expect(lastRequestId).toBeTruthy();

    const [row] = await testDb.db.select().from(imageScans).where(eq(imageScans.id, data.scanId));
    expect(row?.status).toBe('succeeded');
    expect(row?.provider).toBe('mock');
    expect(row?.tokensInput).toBe(12);
  });

  it('is UNAUTHORIZED without a session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/trpc/scan.extract',
      headers: { 'content-type': 'application/json' },
      payload: { json: { imageBase64: SAMPLE_JPEG, mediaType: 'image/jpeg' } },
    });
    expect(res.statusCode).toBe(401);
  });

  it('confirms a 2-item subset into the pantry and flips the scan to confirmed', async () => {
    const data = await extractSample();
    const confirm = await trpc('scan.confirm', { scanId: data.scanId, items: [milkItem, butterItem] });
    expect(confirm.statusCode).toBe(200);
    const created = (JSON.parse(confirm.body) as TrpcData<{ id: string }[]>).result.data.json;
    expect(created).toHaveLength(2);

    const list = await app.inject({ method: 'GET', url: '/trpc/pantry.list', headers: { cookie } });
    expect(list.body).toContain('Whole milk');
    expect(list.body).toContain('Butter');

    const [row] = await testDb.db.select().from(imageScans).where(eq(imageScans.id, data.scanId));
    expect(row?.status).toBe('confirmed');
  });

  it('rejects confirming a scan that does not belong to the user', async () => {
    const res = await trpc('scan.confirm', {
      scanId: '11111111-1111-4111-8111-111111111111',
      items: [milkItem],
    });
    expect(res.statusCode).toBe(404);
  });
});
