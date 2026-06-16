import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { readEnv } from './env.js';
import { buildServer, createDeps } from './server.js';

// Local dev: load the monorepo-root .env when present. In containers/CI the
// runtime injects env directly (and real env vars take precedence over the
// file), so the guard makes this a no-op there.
const envFile = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const env = readEnv();
const app = await buildServer(createDeps(env));
await app.listen({ port: env.PORT, host: '0.0.0.0' });
