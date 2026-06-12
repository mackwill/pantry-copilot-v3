import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { users } from '../src/db/schema/index.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

describe('auth schema migrations', () => {
  let testDb: TestDb;
  beforeAll(async () => {
    testDb = await createTestDb();
  });
  afterAll(async () => {
    await testDb.drop();
  });

  it('creates the four Better Auth tables', async () => {
    const result = await testDb.db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const names = result.rows.map((r) => r['table_name']);
    for (const expected of ['users', 'sessions', 'accounts', 'verifications']) {
      expect(names).toContain(expected);
    }
  });

  it('enforces unique emails', async () => {
    await testDb.db.insert(users).values({ name: 'A', email: 'dup@example.com' });
    await expect(
      testDb.db.insert(users).values({ name: 'B', email: 'dup@example.com' }),
    ).rejects.toThrow();
  });
});
