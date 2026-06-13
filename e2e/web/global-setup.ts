import { execSync } from 'node:child_process';
import { Client } from 'pg';

const ADMIN_URL =
  process.env['TEST_DATABASE_URL'] ?? 'postgres://pantry:pantry@localhost:5432/pantry';
const E2E_DB = 'pantry_e2e';

export default async function globalSetup(): Promise<void> {
  const client = new Client({ connectionString: ADMIN_URL });
  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${E2E_DB} WITH (FORCE)`);
  await client.query(`CREATE DATABASE ${E2E_DB}`);
  await client.end();
  const url = new URL(ADMIN_URL);
  url.pathname = `/${E2E_DB}`;
  execSync('pnpm --filter @pantry/api db:migrate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url.toString() },
  });
}
