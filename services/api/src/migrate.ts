import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

// Mirror index.ts: load the monorepo-root .env in local dev so `db:migrate`
// (and the dev server's pre-start migrate) sees DATABASE_URL without the
// caller having to export it. In containers/CI real env vars take precedence.
const envFile = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const url = process.env['DATABASE_URL'];
if (url === undefined) throw new Error('DATABASE_URL is required');

const pool = new Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle(pool), {
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  });
} finally {
  await pool.end();
}
