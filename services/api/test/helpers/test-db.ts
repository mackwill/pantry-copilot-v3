import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { createDb, type Db } from '../../src/db/client.js';

const ADMIN_URL =
  process.env['TEST_DATABASE_URL'] ?? 'postgres://pantry:pantry@localhost:5432/pantry';

export interface TestDb {
  db: Db;
  url: string;
  drop: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const name = `pantry_test_${randomBytes(4).toString('hex')}`;
  const admin = new Pool({ connectionString: ADMIN_URL, max: 1 });
  try {
    await admin.query(`CREATE DATABASE ${name}`);
  } catch (cause) {
    await admin.end();
    throw new Error(
      `Could not create test database at ${ADMIN_URL}. ` +
        'Is postgres running? Run: podman compose -f infra/podman/compose.yaml up -d',
      { cause },
    );
  }
  const url = new URL(ADMIN_URL);
  url.pathname = `/${name}`;
  const { db, pool } = createDb(url.toString());
  try {
    await migrate(db, {
      migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
    });
  } catch (cause) {
    await pool.end();
    await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
    await admin.end();
    throw new Error(`Migration failed for test database ${name}`, { cause });
  }
  return {
    db,
    url: url.toString(),
    drop: async () => {
      await pool.end();
      await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
      await admin.end();
    },
  };
}
