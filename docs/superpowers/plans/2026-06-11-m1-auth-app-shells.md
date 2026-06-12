# M1 — Auth + App Shells Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Better Auth API service (email/password + conditional Google/Apple OAuth + magic-link plumbing), web + mobile app shells, and the two board §00 login screens passing the fidelity gate.

**Architecture:** `services/api` is a Fastify server mounting Better Auth at `/api/auth/*` and tRPC v11 at `/trpc`, backed by Drizzle/Postgres with committed SQL migrations. `apps/web` (TanStack Start) and `apps/mobile` (Expo + expo-router, routes in `src/app/` so the `jsx-no-literals` glob applies) each own a thin Better Auth client; the shared typed tRPC client lives in `packages/api-client`. Login screens are composed from design-system primitives; mobile needs a batch of native primitive ports first.

**Tech Stack:** Fastify, Better Auth (magicLink + expo plugins), Drizzle + pg, tRPC v11 + superjson, TanStack Start, Expo + expo-router + expo-secure-store, Playwright, Vitest.

**Settled decisions (from planning session, log in decisions.md at Task 17):**
- Auth methods: email/password + Google OAuth + Apple, both OAuth providers conditional on env creds. Magic link is **plumbing only** (no UI); it doubles as the dev/e2e session bootstrap behind `AUTH_DEV_MAGIC_LINK`, which the env schema **rejects in production**. No dev auto-login.
- Sign-up: composed screen from existing primitives (board-silent).
- `packages/contracts` deferred to M2 (M1 has no shared DTO; tRPC types flow via `AppRouter`).
- Ephemeral postgres for tests: real server (compose locally, GH Actions service container in CI) + `CREATE DATABASE pantry_test_<id>` per test file, drizzle `migrate()`, dropped in cleanup. No testcontainers. Never `drizzle-kit push` — committed SQL only.
- Web e2e signs in via the real sign-up/sign-in UI with a unique email per run.
- Mobile fidelity: human side-by-side approval; pixelmatch is NOT the mobile gate (board frame is 390×800, no real device matches). Maestro flow authored, run locally only.
- Containerfile: `services/api` only; web container deferred until it deploys.
- Cookies: `sameSite: 'lax'` default (localhost:3000→4000 is same-site); production attributes env-driven later.

**Install convention:** every `pnpm add` below installs latest stable; `.npmrc save-exact=true` pins. Run installs from the workspace dir given. If a peer-dep conflict with TS 6.0.3 appears (Expo/TanStack toolchains may cap at TS 5.x), give that workspace its own pinned TS version rather than fighting the root.

---

### Task 1: `services/api` scaffold — env, DB schema, migrations, test-db helper

**Files:**
- Modify: `pnpm-workspace.yaml` (add `services/*`, `apps/*`, `e2e/*` globs if missing)
- Create: `services/api/package.json`, `tsconfig.json`, `vitest.config.ts`, `drizzle.config.ts`
- Create: `services/api/src/env.ts`, `src/db/client.ts`, `src/db/schema/auth.ts`, `src/db/schema/index.ts`, `src/migrate.ts`
- Create: `services/api/test/helpers/test-db.ts`
- Test: `services/api/src/env.test.ts`, `services/api/test/db-schema.integration.test.ts`

- [x] **Step 1: Workspace + package scaffold**

Ensure `pnpm-workspace.yaml` includes:

```yaml
packages:
  - 'apps/*'
  - 'services/*'
  - 'packages/*'
  - 'tools/*'
  - 'tools/design-fidelity/gallery'
  - 'e2e/*'
```

(Keep existing entries; add only what's missing.) Create `services/api/package.json`:

```json
{
  "name": "@pantry/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./router": { "types": "./src/trpc/router.ts" }
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/migrate.ts"
  }
}
```

`tsconfig.json` extends the base (mirror how `packages/config` consumers do it; outDir `dist`, rootDir `src`, include `src`). `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
```

Install:

```bash
cd services/api
pnpm add fastify @fastify/helmet @fastify/cors @fastify/rate-limit better-auth @better-auth/expo drizzle-orm pg @trpc/server superjson zod
pnpm add -D drizzle-kit @types/pg tsx vitest typescript
pnpm add @pantry/config --workspace
```

- [x] **Step 2: Write the failing env test** (`src/env.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import { readEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgres://pantry:pantry@localhost:5432/pantry',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
};

describe('readEnv', () => {
  it('parses a minimal valid environment with defaults', () => {
    const env = readEnv(base);
    expect(env.PORT).toBe(4000);
    expect(env.WEB_ORIGIN).toBe('http://localhost:3000');
    expect(env.AUTH_DEV_MAGIC_LINK).toBe(false);
  });

  it('rejects a short BETTER_AUTH_SECRET', () => {
    expect(() => readEnv({ ...base, BETTER_AUTH_SECRET: 'short' })).toThrow();
  });

  it('rejects AUTH_DEV_MAGIC_LINK=true in production', () => {
    expect(() =>
      readEnv({ ...base, NODE_ENV: 'production', AUTH_DEV_MAGIC_LINK: 'true' }),
    ).toThrow(/production/);
  });

  it('coerces AUTH_DEV_MAGIC_LINK=true outside production', () => {
    expect(readEnv({ ...base, AUTH_DEV_MAGIC_LINK: 'true' }).AUTH_DEV_MAGIC_LINK).toBe(true);
  });
});
```

Run: `pnpm --filter @pantry/api test` — expect FAIL (env.ts missing).

- [x] **Step 3: Implement `src/env.ts`**

```ts
import { loadEnv } from '@pantry/config/env';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().default('http://localhost:4000'),
    /** Comma-separable list of allowed browser origins. */
    WEB_ORIGIN: z.string().default('http://localhost:3000'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_SECRET: z.string().optional(),
    AUTH_DEV_MAGIC_LINK: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  })
  .refine((env) => !(env.AUTH_DEV_MAGIC_LINK && env.NODE_ENV === 'production'), {
    message: 'AUTH_DEV_MAGIC_LINK must not be enabled in production',
  });

export type Env = z.infer<typeof schema>;

export function readEnv(source?: Record<string, string | undefined>): Env {
  return loadEnv(schema, source);
}

export function webOrigins(env: Env): string[] {
  return env.WEB_ORIGIN.split(',').map((o) => o.trim());
}
```

(If `loadEnv`'s signature differs from `(schema, source?)`, adapt to its actual API in `packages/config/src/env.ts` — read it first.) Run the test again: PASS.

- [x] **Step 4: DB schema** (`src/db/schema/auth.ts`)

```ts
import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('accounts_user_id_idx').on(table.userId)],
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
);
```

`src/db/schema/index.ts`: `export * from './auth.js';`

`src/db/client.ts`:

```ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

export function createDb(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

export type Db = ReturnType<typeof createDb>['db'];
```

- [x] **Step 5: Drizzle config + generate the first migration**

`drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
});
```

`src/migrate.ts` (used by dev script + container):

```ts
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const url = process.env['DATABASE_URL'];
if (url === undefined) throw new Error('DATABASE_URL is required');

const pool = new Pool({ connectionString: url, max: 1 });
await migrate(drizzle(pool), {
  migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
});
await pool.end();
```

Run: `pnpm --filter @pantry/api db:generate` — expect a new SQL file under `services/api/drizzle/`. Commit it (committed migrations are the contract).

- [x] **Step 6: Test-db helper** (`test/helpers/test-db.ts`)

```ts
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
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
  });
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
```

- [x] **Step 7: Schema integration test** (`test/db-schema.integration.test.ts`)

```ts
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
```

- [x] **Step 8: Run** — `podman compose -f infra/podman/compose.yaml up -d` then `pnpm --filter @pantry/api test`. Expect PASS. Also run `pnpm lint && pnpm typecheck`.

- [x] **Step 9: Commit** — `git add -A && git commit -m "feat(api): scaffold with env loader, auth schema, migrations, test-db helper"`

---

### Task 2: Fastify server skeleton — security middleware + health/ready

**Files:**
- Create: `services/api/src/server.ts`, `src/index.ts`
- Test: `services/api/test/server.integration.test.ts`

- [x] **Step 1: Write failing integration tests**

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { createDeps, buildServer } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

describe('server skeleton', () => {
  let testDb: TestDb;
  let app: FastifyInstance;

  beforeAll(async () => {
    testDb = await createTestDb();
    const env = readEnv({
      NODE_ENV: 'test',
      DATABASE_URL: testDb.url,
      BETTER_AUTH_SECRET: 'a'.repeat(32),
      RATE_LIMIT_MAX: '5',
    });
    app = await buildServer(createDeps(env));
  });
  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('GET /ready returns ready when the database answers', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
  });

  it('sets hardening headers', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  it('allows the configured origin with credentials and ignores others', async () => {
    const ok = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:3000' },
    });
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const bad = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://evil.example' },
    });
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rate-limits past the global max but exempts /health', async () => {
    // RATE_LIMIT_MAX=5 above. /health is allow-listed; another route is not.
    for (let i = 0; i < 10; i += 1) {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
    }
    let limited = false;
    for (let i = 0; i < 10; i += 1) {
      const res = await app.inject({ method: 'GET', url: '/nope' });
      if (res.statusCode === 429) limited = true;
    }
    expect(limited).toBe(true);
  });
});
```

Run: FAIL (server.ts missing).

- [x] **Step 2: Implement `src/server.ts`**

```ts
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { sql } from 'drizzle-orm';
import Fastify, { type FastifyInstance } from 'fastify';
import { createDb, type Db } from './db/client.js';
import { webOrigins, type Env } from './env.js';

export interface AppDeps {
  env: Env;
  db: Db;
}

export function createDeps(env: Env): AppDeps {
  const { db } = createDb(env.DATABASE_URL);
  return { env, db };
}

export async function buildServer(deps: AppDeps): Promise<FastifyInstance> {
  const { env, db } = deps;
  const app = Fastify({ logger: env.NODE_ENV !== 'test' });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
  });

  await app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: 60_000,
    allowList: (req) => req.url === '/health' || req.url === '/ready',
  });

  const allowed = new Set(webOrigins(env));
  await app.register(cors, {
    origin: (origin, cb) => {
      cb(null, origin === undefined || allowed.has(origin));
    },
    credentials: true,
    allowedHeaders: ['content-type', 'authorization', 'cookie', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/ready', async (_req, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: 'ready' };
    } catch (err) {
      app.log.error({ err }, 'readiness probe failed');
      reply.code(503);
      return { status: 'not_ready', reason: 'database_unreachable' };
    }
  });

  return app;
}
```

`src/index.ts`:

```ts
import { readEnv } from './env.js';
import { buildServer, createDeps } from './server.js';

const env = readEnv();
const app = await buildServer(createDeps(env));
await app.listen({ port: env.PORT, host: '0.0.0.0' });
```

- [x] **Step 3: Run tests** — PASS. Note: with `@fastify/cors`, a denied origin gets a CORS error response; if the "ignores others" assertion fails on the exact behavior, assert instead that `access-control-allow-origin` is absent/not the evil origin — the security property is the same.

- [x] **Step 4: Commit** — `git commit -m "feat(api): fastify server with helmet, rate limits, cors, health/ready"`

---

### Task 3: Better Auth instance + Fastify mounting

**Files:**
- Create: `services/api/src/auth/instance.ts`, `src/auth/routes.ts`, `src/auth/headers.ts`, `src/auth/magic-link-outbox.ts`
- Modify: `services/api/src/server.ts` (deps grow `auth` + `outbox`; register routes)
- Test: `services/api/test/auth.integration.test.ts`

- [x] **Step 1: Write failing integration tests**

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

function cookieOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .filter((c): c is string => typeof c === 'string')
    .map((c) => c.split(';')[0] ?? '')
    .join('; ');
}

describe('better auth over fastify', () => {
  let testDb: TestDb;
  let app: FastifyInstance;

  beforeAll(async () => {
    testDb = await createTestDb();
    const env = readEnv({
      NODE_ENV: 'test',
      DATABASE_URL: testDb.url,
      BETTER_AUTH_SECRET: 'a'.repeat(32),
      AUTH_RATE_LIMIT_MAX: '30',
    });
    app = await buildServer(createDeps(env));
  });
  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('sign-up creates a user and sets a session cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Mara', email: 'mara@example.com', password: 'hunter2hunter2' },
    });
    expect(res.statusCode).toBe(200);
    expect(cookieOf(res)).toContain('better-auth');
  });

  it('rejects passwords shorter than 8', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Shorty', email: 'short@example.com', password: 'short' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });

  it('sign-in with valid credentials returns a session; wrong password does not', async () => {
    const ok = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'mara@example.com', password: 'hunter2hunter2' },
    });
    expect(ok.statusCode).toBe(200);
    const cookie = cookieOf(ok);

    const session = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie },
    });
    expect(session.statusCode).toBe(200);
    const body = session.json() as { user?: { email?: string } } | null;
    expect(body?.user?.email).toBe('mara@example.com');

    const bad = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'mara@example.com', password: 'wrong-password' },
    });
    expect(bad.statusCode).toBe(401);
  });

  it('get-session without a cookie is null', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/get-session' });
    expect(res.json()).toBeNull();
  });

  it('sign-out invalidates the session', async () => {
    const signin = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/email',
      payload: { email: 'mara@example.com', password: 'hunter2hunter2' },
    });
    const cookie = cookieOf(signin);
    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      headers: { cookie },
      payload: {},
    });
    const after = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie },
    });
    expect(after.json()).toBeNull();
  });

  it('unconfigured social provider fails with 4xx, not 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-in/social',
      payload: { provider: 'google', callbackURL: 'http://localhost:3000/home' },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});
```

Run: FAIL.

- [x] **Step 2: Implement the pieces**

`src/auth/headers.ts`:

```ts
import type { IncomingHttpHeaders } from 'node:http';

export function toWebHeaders(input: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}
```

`src/auth/magic-link-outbox.ts`:

```ts
export interface MagicLinkMessage {
  email: string;
  url: string;
}

/** Captures the most recent magic link instead of emailing it (M1: no email provider). */
export class MagicLinkOutbox {
  #last: MagicLinkMessage | undefined;

  record(message: MagicLinkMessage): void {
    this.#last = message;
  }

  takeLast(): MagicLinkMessage | undefined {
    const message = this.#last;
    this.#last = undefined;
    return message;
  }
}
```

`src/auth/instance.ts`:

```ts
import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import type { Db } from '../db/client.js';
import { accounts, sessions, users, verifications } from '../db/schema/index.js';
import { webOrigins, type Env } from '../env.js';
import type { MagicLinkOutbox } from './magic-link-outbox.js';

export function createAuth(opts: { env: Env; db: Db; outbox: MagicLinkOutbox }) {
  const { env, db, outbox } = opts;
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [...webOrigins(env), 'pantrycopilot://', 'exp://'],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { users, sessions, accounts, verifications },
    }),
    user: { modelName: 'users', fields: { image: 'avatarUrl' } },
    session: { modelName: 'sessions' },
    account: { modelName: 'accounts' },
    verification: { modelName: 'verifications' },
    advanced: { database: { generateId: false } },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
    },
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID !== undefined && env.GOOGLE_CLIENT_SECRET !== undefined
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.APPLE_CLIENT_ID !== undefined && env.APPLE_CLIENT_SECRET !== undefined
        ? {
            apple: {
              clientId: env.APPLE_CLIENT_ID,
              clientSecret: env.APPLE_CLIENT_SECRET,
            },
          }
        : {}),
    },
    plugins: [
      magicLink({
        sendMagicLink: ({ email, url }) => {
          outbox.record({ email, url });
        },
      }),
      expo(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
```

`advanced.database.generateId: false` lets postgres `defaultRandom()` mint uuid PKs. If the installed Better Auth version rejects that shape, use `advanced: { database: { generateId: () => crypto.randomUUID() } }` instead — check its current docs, don't guess.

`src/auth/routes.ts`:

```ts
import type { FastifyInstance } from 'fastify';
import { toWebHeaders } from './headers.js';
import type { Auth } from './instance.js';

export function registerAuthRoutes(
  app: FastifyInstance,
  auth: Auth,
  opts: { rateLimitMax: number },
): void {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    config: { rateLimit: { max: opts.rateLimitMax, timeWindow: 60_000 } },
    async handler(request, reply) {
      const url = new URL(
        request.url,
        `${request.protocol}://${request.headers.host ?? 'localhost'}`,
      );
      const headers = toWebHeaders(request.headers);
      const init: RequestInit = { method: request.method, headers };
      if (request.method !== 'GET' && request.body !== undefined && request.body !== null) {
        init.body =
          typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
      }
      const response = await auth.handler(new Request(url.toString(), init));
      reply.status(response.status);
      const setCookies = response.headers.getSetCookie();
      if (setCookies.length > 0) reply.header('set-cookie', setCookies);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') return;
        reply.header(key, value);
      });
      reply.send(await response.text());
    },
  });
}
```

Modify `src/server.ts`: `AppDeps` gains `auth: Auth; outbox: MagicLinkOutbox`; `createDeps` constructs the outbox then `createAuth({ env, db, outbox })`; after the CORS registration add `registerAuthRoutes(app, deps.auth, { rateLimitMax: env.AUTH_RATE_LIMIT_MAX });`.

- [x] **Step 3: Run tests** — `pnpm --filter @pantry/api test`. PASS. If cookie names differ (`better-auth.session_token` vs prefix), loosen the assertion to the actual prefix observed — verify by printing the header once, then pin the assertion.

- [x] **Step 4: Commit** — `git commit -m "feat(api): better auth instance mounted at /api/auth with stricter rate limit"`

---

### Task 4: tRPC init + `me` router

**Files:**
- Create: `services/api/src/trpc/context.ts`, `src/trpc/init.ts`, `src/trpc/routers/user.ts`, `src/trpc/router.ts`
- Modify: `services/api/src/server.ts`
- Test: `services/api/test/trpc.integration.test.ts`

- [x] **Step 1: Write failing tests**

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

describe('trpc user.me', () => {
  let testDb: TestDb;
  let app: FastifyInstance;
  let cookie: string;

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(
      createDeps(
        readEnv({
          NODE_ENV: 'test',
          DATABASE_URL: testDb.url,
          BETTER_AUTH_SECRET: 'a'.repeat(32),
        }),
      ),
    );
    const signup = await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { name: 'Mara', email: 'mara@example.com', password: 'hunter2hunter2' },
    });
    const raw = signup.headers['set-cookie'];
    const arr = Array.isArray(raw) ? raw : [raw];
    cookie = arr
      .filter((c): c is string => typeof c === 'string')
      .map((c) => c.split(';')[0] ?? '')
      .join('; ');
  });
  afterAll(async () => {
    await app.close();
    await testDb.drop();
  });

  it('returns the authenticated user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/trpc/user.me',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('mara@example.com');
  });

  it('is UNAUTHORIZED without a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/trpc/user.me' });
    expect(res.statusCode).toBe(401);
  });
});
```

- [x] **Step 2: Implement**

`src/trpc/context.ts`:

```ts
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { toWebHeaders } from '../auth/headers.js';
import type { AppDeps } from '../server.js';

export function createContextFactory(deps: AppDeps) {
  return async function createContext({ req }: CreateFastifyContextOptions) {
    const session = await deps.auth.api.getSession({
      headers: toWebHeaders(req.headers),
    });
    return { db: deps.db, session };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof createContextFactory>>>;
```

`src/trpc/init.ts`:

```ts
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.session === null) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, session: ctx.session } });
});
```

`src/trpc/routers/user.ts`:

```ts
import { protectedProcedure, router } from '../init.js';

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    const { user } = ctx.session;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.image ?? null,
    };
  }),
});
```

`src/trpc/router.ts`:

```ts
import { router } from './init.js';
import { userRouter } from './routers/user.js';

export const appRouter = router({ user: userRouter });
export type AppRouter = typeof appRouter;
```

In `src/server.ts`, after auth routes:

```ts
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContextFactory } from './trpc/context.js';
import { appRouter } from './trpc/router.js';

await app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext: createContextFactory(deps) },
});
```

- [x] **Step 3: Run tests** — PASS. (If the unauthenticated case surfaces as a 200 envelope with an error body rather than HTTP 401 in your tRPC version, assert on the body containing `UNAUTHORIZED` instead.)

- [x] **Step 4: Commit** — `git commit -m "feat(api): trpc init with session context and user.me"`

---

### Task 5: Dev magic-link endpoint (flag-gated)

**Files:**
- Create: `services/api/src/auth/dev-magic-link.ts`
- Modify: `services/api/src/server.ts`
- Test: `services/api/test/dev-magic-link.integration.test.ts`

- [x] **Step 1: Write failing tests**

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { readEnv } from '../src/env.js';
import { buildServer, createDeps } from '../src/server.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';

describe('dev magic link', () => {
  let testDb: TestDb;
  let enabled: FastifyInstance;
  let disabled: FastifyInstance;

  beforeAll(async () => {
    testDb = await createTestDb();
    const base = {
      NODE_ENV: 'test',
      DATABASE_URL: testDb.url,
      BETTER_AUTH_SECRET: 'a'.repeat(32),
    };
    enabled = await buildServer(createDeps(readEnv({ ...base, AUTH_DEV_MAGIC_LINK: 'true' })));
    disabled = await buildServer(createDeps(readEnv(base)));
  });
  afterAll(async () => {
    await enabled.close();
    await disabled.close();
    await testDb.drop();
  });

  it('returns a magic-link url that establishes a session', async () => {
    const res = await enabled.inject({
      method: 'POST',
      url: '/api/dev/magic-link',
      payload: { email: 'dev@example.com' },
    });
    expect(res.statusCode).toBe(200);
    const { url } = res.json() as { url: string };
    expect(url).toContain('/api/auth/');

    const follow = await enabled.inject({ method: 'GET', url: new URL(url).pathname + new URL(url).search });
    const raw = follow.headers['set-cookie'];
    const arr = Array.isArray(raw) ? raw : [raw];
    const cookie = arr
      .filter((c): c is string => typeof c === 'string')
      .map((c) => c.split(';')[0] ?? '')
      .join('; ');
    const session = await enabled.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie },
    });
    const body = session.json() as { user?: { email?: string } } | null;
    expect(body?.user?.email).toBe('dev@example.com');
  });

  it('is absent when the flag is off', async () => {
    const res = await disabled.inject({
      method: 'POST',
      url: '/api/dev/magic-link',
      payload: { email: 'dev@example.com' },
    });
    expect(res.statusCode).toBe(404);
  });
});
```

- [x] **Step 2: Implement `src/auth/dev-magic-link.ts`**

```ts
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../server.js';

const bodySchema = z.object({ email: z.email() });

/** Dev/e2e session bootstrap. Registered only when AUTH_DEV_MAGIC_LINK=true;
 *  the env schema rejects that flag in production. */
export function registerDevMagicLink(app: FastifyInstance, deps: AppDeps): void {
  app.post('/api/dev/magic-link', async (request, reply) => {
    const { email } = bodySchema.parse(request.body);
    await deps.auth.api.signInMagicLink({
      body: { email, callbackURL: '/' },
      headers: new Headers(),
    });
    const message = deps.outbox.takeLast();
    if (message === undefined) {
      reply.code(500);
      return { error: 'magic link was not captured' };
    }
    return { url: message.url };
  });
}
```

In `server.ts`: `if (env.AUTH_DEV_MAGIC_LINK) registerDevMagicLink(app, deps);` (If `auth.api.signInMagicLink` is named differently in the installed version, find the magic-link plugin's server API in its docs; the outbox capture is the part that matters.)

- [x] **Step 3: Run tests** — PASS. **Step 4: Commit** — `git commit -m "feat(api): flag-gated dev magic-link endpoint for e2e session bootstrap"`

---

### Task 6: Containerfile, compose `api` service, CI postgres

**Files:**
- Create: `services/api/Containerfile`
- Modify: `infra/podman/compose.yaml`, `.env.example`, `.github/workflows/ci.yml`

- [x] **Step 1: Containerfile**

```dockerfile
FROM docker.io/library/node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @pantry/api...
RUN pnpm --filter @pantry/api... build
RUN pnpm deploy --filter @pantry/api --prod /out

FROM docker.io/library/node:22-slim
WORKDIR /app
COPY --from=build /out .
EXPOSE 4000
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
```

(`pnpm deploy` copies the built `dist/` and `drizzle/` because they're package files; if `drizzle/` is excluded by default, add a `files` array to `services/api/package.json` listing `dist` and `drizzle`.)

- [x] **Step 2: Compose service** (append to `infra/podman/compose.yaml` services)

```yaml
  api:
    build:
      context: ../..
      dockerfile: services/api/Containerfile
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://pantry:pantry@postgres:5432/pantry
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET:?set in .env}
      BETTER_AUTH_URL: http://localhost:4000
      WEB_ORIGIN: http://localhost:3000
    ports:
      - '4000:4000'
```

Update `.env.example`:

```ini
# Postgres (dev via infra/podman/compose.yaml)
DATABASE_URL=postgres://pantry:pantry@localhost:5432/pantry
# Auth (M1) — secret must be ≥32 chars
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:4000
WEB_ORIGIN=http://localhost:3000
# Optional OAuth providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=
# Dev/e2e only — rejected when NODE_ENV=production
AUTH_DEV_MAGIC_LINK=false
# Filled in at later milestones:
# AI_SERVICE_TOKEN=
# ANTHROPIC_API_KEY=
```

- [x] **Step 3: CI postgres.** In `.github/workflows/ci.yml`, add to the job that runs `pnpm test`:

```yaml
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: pantry
          POSTGRES_PASSWORD: pantry
          POSTGRES_DB: pantry
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U pantry"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      TEST_DATABASE_URL: postgres://pantry:pantry@localhost:5432/pantry
```

- [x] **Step 4: Verify** — `podman build -f services/api/Containerfile -t pantry-api .` succeeds; `BETTER_AUTH_SECRET=$(openssl rand -hex 32) podman compose -f infra/podman/compose.yaml up -d --build` then `curl localhost:4000/ready` → `{"status":"ready"}`. Push a branch / run CI to confirm the service container works. *(CI service-container run deferred to branch push at milestone end.)*

- [x] **Step 5: Commit** — `git commit -m "infra(api): containerfile, compose service, ci postgres"`

---

### Task 7: `packages/api-client`

**Files:**
- Create: `packages/api-client/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/index.ts`
- Test: `packages/api-client/src/index.test.ts`

- [x] **Step 1: Scaffold + install**

```bash
mkdir -p packages/api-client/src && cd packages/api-client
pnpm add @trpc/client superjson
pnpm add -D @trpc/server vitest typescript
pnpm add -D @pantry/api --workspace
```

package.json name `@pantry/api-client`, `"exports": { ".": "./src/index.ts" }` (source exports like design-system if that's the M0 pattern — mirror it), scripts test/typecheck/lint.

- [x] **Step 2: Write the failing test** (`src/index.test.ts`)

```ts
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createApiClient } from './index.js';

describe('createApiClient', () => {
  it('exposes a typed user.me', () => {
    const client = createApiClient({ url: 'http://localhost:4000/trpc' });
    expectTypeOf(client.user.me.query).toBeFunction();
  });

  it('routes requests through the provided fetch', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify([{ result: { data: { json: null } } }]), {
          headers: { 'content-type': 'application/json' },
        }),
    );
    const client = createApiClient({ url: 'http://localhost:4000/trpc', fetch: fetchSpy });
    await client.user.me.query().catch(() => undefined);
    expect(fetchSpy).toHaveBeenCalled();
  });
});
```

- [x] **Step 3: Implement `src/index.ts`**

```ts
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@pantry/api/router';

export interface ApiClientOptions {
  url: string;
  fetch?: typeof globalThis.fetch;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
}

export function createApiClient(opts: ApiClientOptions) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: opts.url,
        transformer: superjson,
        ...(opts.fetch === undefined ? {} : { fetch: opts.fetch }),
        ...(opts.headers === undefined ? {} : { headers: opts.headers }),
      }),
    ],
  });
}

export type { AppRouter };
```

- [x] **Step 4: Run** `pnpm --filter @pantry/api-client test` → PASS; repo `pnpm lint && pnpm typecheck`. **Step 5: Commit** — `git commit -m "feat(api-client): typed trpc client factory"`

---

### Task 8: Design-system native batch-1 primitives + icon additions

The mobile login needs native **Wordmark, Eyebrow, Button, Field, Input** (Pill not needed until M2 — defer, note in decisions.md). Icons: web map lacks `AtSign`, `Lock`, `Apple`, `Chrome`; native map lacks `Apple`, `Chrome`.

**Files:**
- Modify: `packages/design-system/src/web/Icon/Icon.tsx` (add AtSign, Lock, Apple, Chrome to imports + map)
- Modify: `packages/design-system/src/native/Icon/Icon.tsx` (add Apple, Chrome — import from `lucide-react-native/icons`)
- Modify: `packages/design-system/src/native/fonts.ts` (add `displayItalic: 'Newsreader-Italic'`)
- Create: `packages/design-system/src/native/{Wordmark,Eyebrow,Button,Field,Input}/<Name>.tsx` + `<Name>.test.tsx`
- Modify: `packages/design-system/src/native/index.ts` (export the five)

**Method per component (TDD):** write the test first, run to FAIL, implement, run to PASS. Before implementing each, open the web sibling's `.module.css` and mirror its exact values (the numbers below were read from the web sources on 2026-06-11 — re-verify Eyebrow/Wordmark whose CSS wasn't re-read; board spec: Eyebrow 600 11px sans 0.14em uppercase).

- [ ] **Step 1: Icon additions + fonts.ts** (tests: extend existing Icon tests with one render assertion per new name).

- [ ] **Step 2: Native Eyebrow**

```tsx
import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export interface EyebrowProps {
  children: ReactNode;
  color?: string;
  style?: TextStyle;
}

export function Eyebrow({ children, color = tokens.fgMuted, style }: EyebrowProps) {
  return <Text style={[styles.eyebrow, { color }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
  },
});
```

Test: renders children uppercase with the sans family.

- [ ] **Step 3: Native Wordmark** (mirror web Wordmark: Pantry + italic accent "Co" + Pilot, display font, size prop default 26)

```tsx
import { StyleSheet, Text } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

const BRAND = { pantry: 'Pantry', co: 'Co', pilot: 'Pilot' } as const;

export interface WordmarkProps {
  size?: number;
  color?: string;
  accent?: string;
}

export function Wordmark({ size = 26, color = tokens.fg, accent = tokens.accent }: WordmarkProps) {
  return (
    <Text style={[styles.mark, { fontSize: size, color }]}>
      {BRAND.pantry}
      <Text style={[styles.co, { color: accent }]}>{BRAND.co}</Text>
      {BRAND.pilot}
    </Text>
  );
}

const styles = StyleSheet.create({
  mark: { fontFamily: fonts.display, fontWeight: '500', letterSpacing: -0.4 },
  co: { fontFamily: fonts.displayItalic, fontStyle: 'italic' },
});
```

Mirror weight/letter-spacing from `web/Wordmark/Wordmark.module.css`. Test: renders "Pantry", "Co", "Pilot"; Co segment gets the accent color.

- [ ] **Step 4: Native Button** (mirrors `Button.module.css`: sm 32/13, md 38/14, lg 46/15; radius `tokens.rMd`; primary accent/accentFg; secondary transparent + 1px lineStrong border; ghost transparent; inverse bgInverse/bg; danger transparent + dangerSoft border, danger text; disabled opacity 0.5)

```tsx
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  kind?: ButtonKind;
  size?: ButtonSize;
  children: string;
  leftIcon?: ReactNode;
  full?: boolean;
  disabled?: boolean;
  onPress?: (() => void) | undefined;
  style?: ViewStyle;
}

const sizing = {
  sm: { height: 32, paddingHorizontal: 12, fontSize: 13, gap: 6 },
  md: { height: 38, paddingHorizontal: 16, fontSize: 14, gap: 8 },
  lg: { height: 46, paddingHorizontal: 22, fontSize: 15, gap: 10 },
} as const;

const palette: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: tokens.accent, fg: tokens.accentFg },
  secondary: { bg: 'transparent', fg: tokens.fg, border: tokens.lineStrong },
  ghost: { bg: 'transparent', fg: tokens.fg },
  inverse: { bg: tokens.bgInverse, fg: tokens.bg },
  danger: { bg: 'transparent', fg: tokens.danger, border: tokens.dangerSoft },
};

export function Button({
  kind = 'primary',
  size = 'md',
  children,
  leftIcon,
  full = false,
  disabled = false,
  onPress,
  style,
}: ButtonProps) {
  const s = sizing[size];
  const p = palette[kind];
  return (
    <Pressable
      role="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          gap: s.gap,
          backgroundColor: p.bg,
        },
        p.border !== undefined && { borderWidth: 1, borderColor: p.border },
        full && styles.full,
        disabled && styles.disabled,
        style,
      ]}
    >
      {leftIcon}
      <Text style={[styles.label, { fontSize: s.fontSize, color: p.fg }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.rMd,
    alignSelf: 'flex-start',
  },
  full: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  label: { fontFamily: fonts.sans, fontWeight: '500', letterSpacing: -0.07 },
});
```

Tests: onPress fires; disabled blocks press; primary vs secondary styles; `full` stretches; leftIcon slot renders.

- [ ] **Step 5: Native Field** (mirrors `Field.module.css`: label 500 12 fgMuted mb6; hint 12 fgSubtle; error 500 12 danger; error wins over hint)

```tsx
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function Field({ label, hint, error, children, style }: FieldProps) {
  return (
    <View style={style}>
      {label !== undefined && <Text style={styles.label}>{label}</Text>}
      {children}
      {hint !== undefined && error === undefined && <Text style={styles.hint}>{hint}</Text>}
      {error !== undefined && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.fgMuted,
    marginBottom: 6,
  },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: tokens.fgSubtle, marginTop: 6 },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.danger,
    marginTop: 6,
  },
});
```

Tests: label renders; error suppresses hint.

- [ ] **Step 6: Native Input** (mirrors `Input.module.css`: row, gap 10, bgRaised, 1px line border, radius rMd, padding 11/14, 14px sans text, subtle placeholder)

```tsx
import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export interface InputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  leftIcon?: ReactNode;
  testID?: string;
  style?: ViewStyle;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  leftIcon,
  testID,
  style,
}: InputProps) {
  return (
    <View style={[styles.wrap, style]}>
      {leftIcon !== undefined && <View>{leftIcon}</View>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.fgSubtle}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        {...(testID === undefined ? {} : { testID })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rMd,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: tokens.fg,
    letterSpacing: -0.07,
    padding: 0,
  },
});
```

Tests: controlled value + onChangeText; leftIcon renders; secureTextEntry passthrough.

- [ ] **Step 7: Barrel + run** — export all five from `src/native/index.ts`; `pnpm --filter @pantry/design-system test` PASS; gallery still typechecks.

- [ ] **Step 8: Commit** — `git commit -m "feat(design-system): native batch-1 primitives (wordmark, eyebrow, button, field, input) + login icons"`

---

### Task 9: `apps/web` scaffold + auth client + session guard (SSR cookie spike FIRST)

**Files:**
- Create: `apps/web/package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`
- Create: `apps/web/src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/_authed.tsx`, `src/routes/_authed/home.tsx`
- Create: `apps/web/src/lib/env.ts`, `src/lib/auth-client.ts`, `src/lib/session.ts`, `src/lib/api.ts`, `src/styles/app.css`
- Test: `apps/web/src/lib/session.test.ts`

- [ ] **Step 1: Scaffold.** Follow the current TanStack Start docs for the canonical Vite setup (the plugin import path has churned across versions — verify against the installed version, do not copy blindly):

```bash
mkdir -p apps/web/src && cd apps/web
pnpm add react react-dom @tanstack/react-start @tanstack/react-router better-auth
pnpm add @pantry/design-system @pantry/api-client @pantry/config --workspace
pnpm add -D vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom typescript
```

`vite.config.ts` (adjust plugin import to installed version's docs):

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000 },
  plugins: [tanstackStart(), viteReact()],
});
```

`src/styles/app.css`: `@import '@pantry/design-system/src/styles/tokens.css';` (use whatever export path the design-system package.json exposes for tokens.css — check it; add an export entry if M0 didn't).

`src/lib/env.ts`:

```ts
import { z } from 'zod';

const schema = z.object({
  VITE_API_URL: z.string().default('http://localhost:4000'),
});

export const env = schema.parse({
  VITE_API_URL: import.meta.env['VITE_API_URL'] as string | undefined,
});
```

`src/lib/auth-client.ts`:

```ts
import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { env } from './env';

export const authClient = createAuthClient({
  baseURL: `${env.VITE_API_URL}/api/auth`,
  fetchOptions: { credentials: 'include' },
  plugins: [magicLinkClient()],
});
```

`src/lib/api.ts`:

```ts
import { createApiClient } from '@pantry/api-client';
import { env } from './env';

export const api = createApiClient({
  url: `${env.VITE_API_URL}/trpc`,
  fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
});
```

- [ ] **Step 2: Session helper with SSR cookie forwarding** (`src/lib/session.ts`). This is the milestone's riskiest seam — get it green before any screen work.

```ts
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { z } from 'zod';

const sessionSchema = z
  .object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
    }),
  })
  .nullable();

export type SessionData = NonNullable<z.infer<typeof sessionSchema>>;

const apiUrl = (): string =>
  (typeof process !== 'undefined' ? process.env['VITE_API_URL'] : undefined) ??
  'http://localhost:4000';

async function parseSession(res: Response): Promise<SessionData | null> {
  if (!res.ok) return null;
  return sessionSchema.parse(await res.json());
}

const getSessionOnServer = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionData | null> => {
    const headers = getRequestHeaders();
    const cookie = headers.get('cookie');
    const res = await fetch(`${apiUrl()}/api/auth/get-session`, {
      headers: cookie === null ? {} : { cookie },
    });
    return parseSession(res);
  },
);

export async function getSession(): Promise<SessionData | null> {
  if (typeof window === 'undefined') return getSessionOnServer();
  const res = await fetch(`${apiUrl()}/api/auth/get-session`, { credentials: 'include' });
  return parseSession(res);
}
```

If `getRequestHeaders` lives elsewhere in the installed version (it has moved between `@tanstack/react-start/server` and `vinxi`/`h3` helpers historically), find the current API and adapt — the requirement is "read the incoming request's cookie header inside a server function".

Unit tests (`src/lib/session.test.ts`, mock `fetch`): returns parsed session on 200 with user; returns null on null body or non-OK.

- [ ] **Step 3: Routes** (composition-only):

`src/routes/__root.tsx` — standard Start root document importing `../styles/app.css`.

`src/routes/index.tsx`:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { getSession } from '../lib/session';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSession();
    throw redirect({ to: session === null ? '/login' : '/home' });
  },
});
```

`src/routes/_authed.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getSession } from '../lib/session';

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const session = await getSession();
    if (session === null) throw redirect({ to: '/login' });
    return { session };
  },
  component: Outlet,
});
```

`src/routes/_authed/home.tsx` — placeholder authed shell proving the tRPC pipe: render `WebShell` (minimal nav config) with a component that calls `api.user.me.query()` in a loader and shows the user's name (string via a `features/home/strings.ts`).

`src/routes/login.tsx` / `signup.tsx` — render `<LoginScreen />` / `<SignupScreen />` (built in Tasks 10–11; stub the import with a placeholder component now so the spike runs).

- [ ] **Step 4: SPIKE VERIFICATION (manual, blocking):** run api (`pnpm --filter @pantry/api dev` with `.env`) + web (`pnpm --filter @pantry/web dev`). In a browser: sign up via `curl`-created user or the auth client console, then confirm (a) hard reload of `/home` stays on home (SSR path forwarded the cookie), (b) client-side nav from `/login` to `/home` works, (c) unauthenticated `/home` redirects to `/login`. Do not proceed until all three hold.

- [ ] **Step 5: Run** unit tests + repo lint/typecheck. **Step 6: Commit** — `git commit -m "feat(web): tanstack start scaffold with auth client and ssr session guard"`

---

### Task 10: Web login feature (board §00 Web · Login)

**Files:**
- Create: `apps/web/src/features/auth/strings.ts`, `useLogin.ts`, `components/LoginScreen.tsx`, `components/LoginForm.tsx`, `components/LoginHero.tsx`, `components/login.module.css`
- Modify: `apps/web/src/routes/login.tsx`
- Test: `apps/web/src/features/auth/LoginForm.test.tsx`, `useLogin.test.ts`

- [ ] **Step 1: strings.ts** (exact board copy — em-split headings use a `{before, em}` pair, reused on mobile):

```ts
export const authStrings = {
  login: {
    eyebrow: 'Welcome back',
    heading: { before: 'Sign in to your', em: 'kitchen.' },
    lede: 'Pick up where you left off — your pantry, your saved recipes, the chaos slider exactly where you parked it.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    keepSignedIn: 'Keep me signed in',
    forgotPassword: 'Forgot password',
    submit: 'Sign in',
    divider: 'or',
    oauthApple: 'Continue with Apple',
    oauthGoogle: 'Continue with Google',
    footerPrompt: 'New here?',
    footerCta: 'Create an account →',
    errors: {
      emailRequired: 'Enter your email.',
      passwordRequired: 'Enter your password.',
      invalidCredentials: 'That email and password don’t match.',
      oauthFailed: 'That sign-in method isn’t available right now.',
    },
  },
  hero: {
    eyebrow: 'Tonight’s idea',
    heading: { before: 'Burnt-butter', em: 'milk ramen.' },
    description:
      'A dairy-noodle hybrid that shouldn’t work. It works. Generated for someone with milk that’s about to turn and a half pack of soba.',
    pillTime: '22 min',
    pillIngredients: '7 ingredients',
    pillExpiring: 'uses 3 expiring',
    weirdness: 'weirdness · 0.62',
    meta: 'v1.4 · Apr 21',
  },
} as const;
```

(Watch the apostrophes: the board uses straight text; typographic quotes are fine and consistent — pick one and keep it identical across web/mobile.)

- [ ] **Step 2: Failing hook test** (`useLogin.test.ts`, mock `../../lib/auth-client` and `@tanstack/react-router`'s `useNavigate`):

- submit with empty email sets `errors.emailRequired`, does not call signIn
- submit with valid fields calls `authClient.signIn.email({ email, password, rememberMe: true })` and navigates to `/home`
- signIn resolving with `{ error: {...} }` sets `errors.invalidCredentials`
- `oauth('google')` calls `authClient.signIn.social({ provider: 'google', callbackURL: <origin>/home })`

- [ ] **Step 3: Implement `useLogin.ts`**

```ts
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { authStrings } from './strings';

export type OAuthProvider = 'google' | 'apple';

export function useLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const submit = async (): Promise<void> => {
    if (email === '') {
      setError(authStrings.login.errors.emailRequired);
      return;
    }
    if (password === '') {
      setError(authStrings.login.errors.passwordRequired);
      return;
    }
    setError(undefined);
    setPending(true);
    const result = await authClient.signIn.email({ email, password, rememberMe });
    setPending(false);
    if (result.error) {
      setError(authStrings.login.errors.invalidCredentials);
      return;
    }
    await navigate({ to: '/home' });
  };

  const oauth = async (provider: OAuthProvider): Promise<void> => {
    const result = await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/home`,
    });
    if (result.error) setError(authStrings.login.errors.oauthFailed);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    error,
    pending,
    submit,
    oauth,
  };
}
```

- [ ] **Step 4: Components.** `LoginScreen.tsx` = two-column grid (`login.module.css`: `grid-template-columns: 1fr 1fr; min-height: 100vh; background: var(--bg)`), left `<LoginForm/>`, right `<LoginHero/>`.

`LoginForm.tsx` (composition; board values in the css module):

```tsx
import { Button, Eyebrow, Field, Icon, Input, Wordmark } from '@pantry/design-system/web';
import { Link } from '@tanstack/react-router';
import { useLogin } from '../useLogin';
import { authStrings } from '../strings';
import styles from './login.module.css';

const s = authStrings.login;

export function LoginForm() {
  const login = useLogin();
  return (
    <div className={styles['formColumn']}>
      <Wordmark size={26} />
      <div className={styles['formBody']}>
        <Eyebrow style={{ marginBottom: 18 }}>{s.eyebrow}</Eyebrow>
        <h1 className={styles['heading']}>
          {s.heading.before}
          <br />
          <em>{s.heading.em}</em>
        </h1>
        <p className={styles['lede']}>{s.lede}</p>
        <form
          className={styles['fields']}
          onSubmit={(e) => {
            e.preventDefault();
            void login.submit();
          }}
        >
          <Field label={s.emailLabel} {...(login.error === undefined ? {} : { error: login.error })}>
            <Input
              value={login.email}
              onChange={login.setEmail}
              type="email"
              name="email"
              leftIcon={<Icon name="AtSign" size={16} />}
            />
          </Field>
          <Field label={s.passwordLabel}>
            <Input
              value={login.password}
              onChange={login.setPassword}
              type="password"
              name="password"
              leftIcon={<Icon name="Lock" size={16} />}
            />
          </Field>
          <div className={styles['rememberRow']}>
            <label className={styles['remember']}>
              <button
                type="button"
                role="checkbox"
                aria-checked={login.rememberMe}
                aria-label={s.keepSignedIn}
                className={login.rememberMe ? styles['checkOn'] : styles['checkOff']}
                onClick={() => login.setRememberMe(!login.rememberMe)}
              >
                {login.rememberMe ? <Icon name="Check" size={11} color="#fff" /> : null}
              </button>
              {s.keepSignedIn}
            </label>
            <span className={styles['forgot']}>{s.forgotPassword}</span>
          </div>
          <Button kind="primary" size="lg" full type="submit" disabled={login.pending} style={{ marginTop: 8 }}>
            {s.submit}
          </Button>
          <div className={styles['divider']}>
            <span className={styles['dividerLine']} />
            <span className={styles['dividerText']}>{s.divider}</span>
            <span className={styles['dividerLine']} />
          </div>
          <Button kind="secondary" full leftIcon={<Icon name="Apple" size={16} />} onClick={() => void login.oauth('apple')}>
            {s.oauthApple}
          </Button>
          <Button kind="secondary" full leftIcon={<Icon name="Chrome" size={16} />} onClick={() => void login.oauth('google')}>
            {s.oauthGoogle}
          </Button>
        </form>
      </div>
      <div className={styles['footer']}>
        {s.footerPrompt}{' '}
        <Link to="/signup" className={styles['footerCta']}>
          {s.footerCta}
        </Link>
      </div>
    </div>
  );
}
```

`LoginHero.tsx`: inverse panel per the board JSX — radial gradient overlay div, dot+eyebrow row, 72px Newsreader display with `<em>`, description, three `Pill`s with the board's explicit rgba styles, weirdness label + 220×4 gradient track with a knob at 62%, meta line. All text from `authStrings.hero`. Styles in `login.module.css`:

```css
.screen { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; background: var(--bg); font-family: var(--font-sans); }
.formColumn { padding: 64px 80px; display: flex; flex-direction: column; justify-content: space-between; }
.formBody { max-width: 420px; }
.heading { font: 400 56px/1 var(--font-display); letter-spacing: -0.025em; color: var(--fg); margin: 0 0 16px; }
.heading em { color: var(--accent); }
.lede { font: 400 15px/1.55 var(--font-sans); color: var(--fg-muted); margin: 0 0 32px; letter-spacing: -0.005em; }
.fields { display: flex; flex-direction: column; gap: 14px; }
.rememberRow { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.remember { display: flex; gap: 8px; align-items: center; font: 400 13px var(--font-sans); color: var(--fg-muted); }
.checkOn, .checkOff { width: 16px; height: 16px; border-radius: 4px; border: none; padding: 0; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.checkOn { background: var(--accent); }
.checkOff { background: var(--bg-raised); border: 1px solid var(--line-strong); }
.forgot { font: 500 13px var(--font-sans); color: var(--accent); cursor: pointer; }
.divider { display: flex; align-items: center; gap: 12px; margin: 6px 0; }
.dividerLine { flex: 1; height: 1px; background: var(--line); }
.dividerText { font: 400 12px var(--font-sans); color: var(--fg-subtle); }
.footer { font: 400 13px var(--font-sans); color: var(--fg-subtle); }
.footerCta { color: var(--accent); font-weight: 500; text-decoration: none; }
.hero { background: var(--bg-inverse); color: var(--bg); padding: 64px 80px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
.heroGlow { position: absolute; inset: 0; background: radial-gradient(ellipse at top right, rgba(79, 107, 46, 0.18), transparent 60%); pointer-events: none; }
.heroEyebrowRow { position: relative; display: flex; align-items: center; gap: 8px; color: rgba(250, 250, 247, 0.6); }
.heroDot { width: 6px; height: 6px; background: #a4c46b; border-radius: 999px; }
.heroDisplay { font: 400 72px/1 var(--font-display); letter-spacing: -0.025em; color: var(--bg); margin-bottom: 24px; }
.heroDesc { font: 400 16px/1.6 var(--font-sans); color: rgba(250, 250, 247, 0.7); max-width: 380px; letter-spacing: -0.005em; }
.heroPills { display: flex; gap: 8px; margin-top: 24px; }
.heroFooter { position: relative; display: flex; justify-content: space-between; align-items: flex-end; }
.weirdLabel { font: 400 11px var(--font-mono); color: rgba(250, 250, 247, 0.4); }
.weirdTrack { width: 220px; height: 4px; border-radius: 999px; background: linear-gradient(90deg, #d8e6b8, #4f6b2e, #2b3b6e); }
.weirdKnob { position: relative; top: -4px; left: calc(62% - 6px); width: 12px; height: 12px; border-radius: 999px; background: var(--bg); }
```

`routes/login.tsx` becomes composition-only:

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginScreen } from '../features/auth/components/LoginScreen';
import { getSession } from '../lib/session';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSession();
    if (session !== null) throw redirect({ to: '/home' });
  },
  component: LoginScreen,
});
```

- [ ] **Step 5: Component tests** (`LoginForm.test.tsx`): renders email/password fields, sign-in + both OAuth buttons, forgot link — all asserted against `authStrings` values; submit path calls mocked signIn; error string appears after failed signIn.

- [ ] **Step 6: Run** `pnpm --filter @pantry/web test` PASS, repo lint/typecheck. Eyeball at `localhost:3000/login` against the board. **Step 7: Commit** — `git commit -m "feat(web): board §00 login screen"`

---

### Task 11: Web sign-up composed screen

**Files:**
- Create: `apps/web/src/features/auth/components/SignupScreen.tsx`, `useSignup.ts`; extend `strings.ts`
- Modify: `apps/web/src/routes/signup.tsx`
- Test: `apps/web/src/features/auth/SignupScreen.test.tsx`

- [ ] **Step 1:** Extend `authStrings` with a `signup` block: eyebrow `'Get started'`, heading `{ before: 'Set up your', em: 'kitchen.' }`, lede, `nameLabel: 'Name'`, email/password labels reused, `submit: 'Create account'`, footer `'Already have an account?'` / `'Sign in →'`, errors (`nameRequired`, `emailTaken`, generic). **This is a board-silent screen: primitives only, mirroring login's left column exactly (same grid + hero on the right reuses `LoginHero`).** Record in `docs/decisions.md` at Task 17.

- [ ] **Step 2:** Failing tests: renders name/email/password + create-account button from strings; submit calls `authClient.signUp.email({ name, email, password })` then navigates `/home`; server error surfaces `emailTaken` string; footer link routes to `/login`.

- [ ] **Step 3:** Implement `useSignup.ts` (same shape as `useLogin`, calling `authClient.signUp.email`) and `SignupScreen.tsx` (reuses `login.module.css` layout classes + `LoginHero`). Route `signup.tsx` mirrors `login.tsx` (redirect if authed, component only).

- [ ] **Step 4: Run tests** PASS. **Step 5: Commit** — `git commit -m "feat(web): composed sign-up screen (board-silent, primitives only)"`

---

### Task 12: Web e2e (Playwright) + CI job

**Files:**
- Create: `e2e/web/package.json`, `playwright.config.ts`, `global-setup.ts`, `specs/auth.spec.ts`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Scaffold** — `cd e2e/web && pnpm add -D @playwright/test pg @types/pg typescript`. package.json name `@pantry/e2e-web`, script `"test": "playwright test"`, and **exclude it from the repo-wide `pnpm test`** if that runs `-r` (give it a distinct script name like `e2e` instead of `test` so CI controls when browsers run): `"e2e": "playwright test"`.

- [ ] **Step 2: `global-setup.ts`** — create+migrate the e2e database:

```ts
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
```

- [ ] **Step 3: `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

const E2E_DATABASE_URL = (
  process.env['TEST_DATABASE_URL'] ?? 'postgres://pantry:pantry@localhost:5432/pantry'
).replace(/\/[^/]*$/, '/pantry_e2e');

export default defineConfig({
  testDir: './specs',
  globalSetup: './global-setup.ts',
  use: { baseURL: 'http://localhost:3000' },
  webServer: [
    {
      command: 'pnpm --filter @pantry/api dev',
      url: 'http://localhost:4000/health',
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: E2E_DATABASE_URL,
        BETTER_AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-xx',
        AUTH_DEV_MAGIC_LINK: 'true',
      },
    },
    {
      command: 'pnpm --filter @pantry/web dev',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://localhost:4000' },
    },
  ],
});
```

- [ ] **Step 4: `specs/auth.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

const uniqueEmail = (): string =>
  `e2e-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;

test('unauthenticated /home redirects to /login', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login/);
});

test('sign up → authed home → sign back in', async ({ page }) => {
  const email = uniqueEmail();
  const password = 'hunter2hunter2';

  await page.goto('/signup');
  await page.getByLabel('Name').fill('E2E Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/home/);
  await expect(page.getByText('E2E Tester')).toBeVisible();

  // Session survives reload (SSR cookie path).
  await page.reload();
  await expect(page).toHaveURL(/\/home/);

  // Fresh context sign-in via the login form.
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/home/);
});
```

- [ ] **Step 5: Run locally** — `pnpm --filter @pantry/e2e-web exec playwright install chromium`, then `pnpm --filter @pantry/e2e-web e2e`. PASS.

- [ ] **Step 6: CI job** — add to `ci.yml` after the checks job (same postgres `services:` block as Task 6, plus):

```yaml
  e2e-web:
    runs-on: ubuntu-latest
    needs: checks
    services: # postgres, same as the checks job
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: pantry
          POSTGRES_PASSWORD: pantry
          POSTGRES_DB: pantry
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U pantry"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      TEST_DATABASE_URL: postgres://pantry:pantry@localhost:5432/pantry
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @pantry/e2e-web exec playwright install --with-deps chromium
      - run: pnpm --filter @pantry/e2e-web e2e
```

(Match the existing workflow's action versions/steps style.)

- [ ] **Step 7: Commit** — `git commit -m "test(e2e): web auth happy path + ci job"`

---### Task 13: Web fidelity capture + approval (gate frame 1/2)

**Files:**
- Create: `tools/design-fidelity/src/capture-app-web.ts`; add script `"capture:web"` to `tools/design-fidelity/package.json`
- Create: `docs/checklists/m1-auth.md`

- [ ] **Step 1: Capture script.** Mirror `capture-references.ts`'s browser settings exactly (viewport 1280×860, same deviceScaleFactor — read that file and copy its values). Behavior: launch chromium → `goto('http://localhost:3000/login')` → wait for `document.fonts.ready` and network idle → **fill the board's fixture state** (the reference frame shows populated fields): email `mara@home.kitchen`, password any 12-char value (renders as 12 dots), keep-signed-in already defaults to checked → blur focus (`page.mouse.click(0,0)` is not enough if it triggers overlays; use `page.locator('body').press('Escape')` or blur via evaluate so no focus ring shows) → screenshot to `tools/design-fidelity/output/app/marketing-auth--web-login.png`.

- [ ] **Step 2: Compare** — `pnpm -C tools/design-fidelity compare references/marketing-auth--web-login.png output/app/marketing-auth--web-login.png` → open `output/report.html`. Iterate on `login.module.css` until layout/spacing/type/color match (human judgment, not pixel identity).

- [ ] **Step 3: Record** — create `docs/checklists/m1-auth.md`:

```markdown
# M1 — Auth + app shells: fidelity checklist

| Frame | Reference | Status | Pixelmatch % (tripwire baseline) |
| --- | --- | --- | --- |
| Web · Login | references/marketing-auth--web-login.png | approved YYYY-MM-DD | n.nn% |
| Mobile · Login | references/marketing-auth--mobile-login.png | approved YYYY-MM-DD | n/a (size mismatch — see decisions.md) |

Pinned simulator: <device name>, iOS <version> (set at Task 16).
```

- [ ] **Step 4: Commit** — `git commit -m "feat(tools): web app capture; m1 web login frame approved"`

---

### Task 14: `apps/mobile` scaffold — expo-router tabs, fonts, auth client

**Files:**
- Create: `apps/mobile/package.json`, `app.json`, `tsconfig.json`, `vitest.config.ts`, `metro.config.cjs`, `babel.config.js`
- Create: `apps/mobile/src/app/_layout.tsx`, `src/app/(auth)/login.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/{index,pantry,cook,scan,me}.tsx`
- Create: `apps/mobile/src/lib/env.ts`, `src/lib/auth-client.ts`, `src/lib/api.ts`, `src/lib/useAuthGate.ts`, `src/features/shell/strings.ts`
- Test: `apps/mobile/src/lib/useAuthGate.test.ts`, `src/app/tabs-layout.test.tsx`

- [ ] **Step 1: Scaffold with the current Expo SDK.** Use `pnpm create expo-app@latest apps/mobile --template blank-typescript`, then convert: package name `@pantry/mobile`, `"main": "expo-router/entry"`, move routes under `src/app/` (expo-router supports `src/app`; **required** so the `react/jsx-no-literals` glob `apps/**/src/**/*.tsx` covers route files). Install with `npx expo install` so versions match the SDK:

```bash
cd apps/mobile
npx expo install expo-router expo-secure-store expo-font expo-splash-screen expo-status-bar expo-linking expo-constants react-native-safe-area-context react-native-screens react-native-svg
pnpm add better-auth @better-auth/expo
pnpm add @pantry/design-system @pantry/api-client --workspace
pnpm add -D react-native-web react-dom vitest jsdom @testing-library/react
```

`app.json`: `"scheme": "pantrycopilot"`, name/slug `pantry-copilot`. `metro.config.cjs`: extend `expo/metro-config` default, add repo root to `watchFolders`, and push `'woff2'` onto `resolver.assetExts` (fonts ship as woff2 in design-system). `vitest.config.ts`: copy `packages/design-system/vitest.config.ts`'s alias/inline setup verbatim (react-native → react-native-web, `.web.*` extension priority, inlined deps) — it's the proven pattern.

- [ ] **Step 2: Fonts + root layout** (`src/app/_layout.tsx`):

```tsx
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useAuthGate } from '../lib/useAuthGate';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader: require('@pantry/design-system/fonts/Newsreader-Variable.woff2'),
    'Newsreader-Italic': require('@pantry/design-system/fonts/Newsreader-Italic.woff2'),
    Inter: require('@pantry/design-system/fonts/Inter-Variable.woff2'),
    'JetBrains Mono': require('@pantry/design-system/fonts/JetBrainsMono-Variable.woff2'),
  });
  useAuthGate();
  if (!fontsLoaded) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Day-one simulator verification (blocking):** boot the iOS simulator (`npx expo run:ios` or Expo Go) and confirm Newsreader/Inter render. If woff2 variable fonts fail on iOS, download the static TTF instances (Newsreader 400 + italic, Inter 400/500/600), put them in `packages/design-system/fonts/native/`, point `useFonts` there, and log the decision in `docs/decisions.md`. (`require` of a package asset may also need a metro `extraNodeModules` entry — if `require('@pantry/design-system/fonts/...')` fails, use a relative path `../../../../packages/design-system/fonts/...` and note it.)

- [ ] **Step 3: lib.** `src/lib/env.ts`:

```ts
import { z } from 'zod';

const schema = z.object({
  EXPO_PUBLIC_API_URL: z.string().default('http://localhost:4000'),
});

export const env = schema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});
```

`src/lib/auth-client.ts`:

```ts
import { expoClient } from '@better-auth/expo/client';
import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { env } from './env';

export const authClient = createAuthClient({
  baseURL: `${env.EXPO_PUBLIC_API_URL}/api/auth`,
  plugins: [
    expoClient({ scheme: 'pantrycopilot', storagePrefix: 'pantry-copilot', storage: SecureStore }),
    magicLinkClient(),
  ],
});
```

`src/lib/api.ts` (expo cookie-header injection, the documented `@better-auth/expo` pattern):

```ts
import { createApiClient } from '@pantry/api-client';
import { authClient } from './auth-client';
import { env } from './env';

export const api = createApiClient({
  url: `${env.EXPO_PUBLIC_API_URL}/trpc`,
  headers: () => ({ cookie: authClient.getCookie() }),
});
```

`src/lib/useAuthGate.ts` (extracted, testable):

```ts
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { authClient } from './auth-client';

export function useAuthGate(): void {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (session === null && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session !== null && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isPending, session, segments, router]);
}
```

- [ ] **Step 4: Tabs.** `src/features/shell/strings.ts`:

```ts
export const shellStrings = {
  tabs: { home: 'Home', pantry: 'Pantry', cook: 'Cook', scan: 'Scan', me: 'Me' },
} as const;
```

`src/app/(tabs)/_layout.tsx`:

```tsx
import { MobileTabBar, type MobileTabBarItem } from '@pantry/design-system/native';
import { Tabs } from 'expo-router';
import { shellStrings } from '../../features/shell/strings';

const items: MobileTabBarItem[] = [
  { id: 'index', label: shellStrings.tabs.home, icon: 'House' },
  { id: 'pantry', label: shellStrings.tabs.pantry, icon: 'Refrigerator' },
  { id: 'cook', label: shellStrings.tabs.cook, icon: 'ChefHat' },
  { id: 'scan', label: shellStrings.tabs.scan, icon: 'ScanLine' },
  { id: 'me', label: shellStrings.tabs.me, icon: 'User' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <MobileTabBar
          items={items}
          active={state.routes[state.index]?.name ?? 'index'}
          onPress={(id) => navigation.navigate(id)}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pantry" />
      <Tabs.Screen name="cook" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
```

The five tab screens are placeholder shells (e.g. `index.tsx` renders an empty `View` with `tokens.bg` background; no literals).

- [ ] **Step 5: Tests** — `useAuthGate.test.ts` (mock `expo-router` + `authClient.useSession`): redirects to login when session null outside `(auth)`; redirects to tabs when session present inside `(auth)`; no redirect while pending. `tabs-layout.test.tsx`: rendering `MobileTabBar` with `items` shows the five labels from `shellStrings` (render the bar directly with rn-web; don't fight expo-router's native Tabs in jsdom).

- [ ] **Step 6: Run** mobile tests + repo lint/typecheck; boot once on the simulator to confirm the gate redirects to the (placeholder) login route. **Step 7: Commit** — `git commit -m "feat(mobile): expo scaffold with router tabs, fonts, auth client and gate"`

---

### Task 15: Mobile login feature (board §00 Mobile · Login)

**Files:**
- Create: `apps/mobile/src/features/auth/strings.ts`, `useLogin.ts`, `components/LoginScreen.tsx`, `components/LoginForm.tsx`
- Modify: `apps/mobile/src/app/(auth)/login.tsx` (composition-only)
- Test: `apps/mobile/src/features/auth/useLogin.test.ts`, `LoginForm.test.tsx`

- [ ] **Step 1: strings.ts** — same vocabulary as web's `authStrings.login` with the board's mobile lede (it differs: no "exactly"): `'Pick up where you left off — your pantry, your saved recipes, the chaos slider where you parked it.'`; footer `'New here?'` / `'Create an account'` (no arrow on mobile).

- [ ] **Step 2: Failing hook test** — `useLogin` mirrors web: empty-field errors; success calls `authClient.signIn.email` then `router.replace('/(tabs)')`; failure sets `invalidCredentials`; `oauth('google')` calls `signIn.social`.

- [ ] **Step 3: Implement.** `useLogin.ts` is the web hook with `useRouter` from expo-router and `router.replace('/(tabs)')`. `LoginScreen.tsx` (board values: bg screen, paddingTop 54, content padding 40/24/0, flex column with bottom-anchored footer):

```tsx
import { ScrollView, StyleSheet, View } from 'react-native';
import { tokens } from '@pantry/design-system/native'; // or tokens import path per package exports
import { LoginForm } from './LoginForm';

export function LoginScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <LoginForm />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54 },
  content: { paddingTop: 40, paddingHorizontal: 24, flexGrow: 1 },
});
```

(Use the actual tokens export — `@pantry/design-system` exposes `tokens` via `src/tokens/native.ts`; check the package exports map and import accordingly.)

`LoginForm.tsx` — Wordmark(22); marginTop 60 block; Eyebrow mb16; 44px Newsreader heading with italic accent `em` segment (nested `Text` with `fonts.displayItalic`, color `tokens.accent`); lede 15/1.5 fgMuted mb28; fields column gap 12 (Email Input `keyboardType="email-address"` + AtSign 15, Password `secureTextEntry` + Lock 15); right-aligned forgot link (500 13 accent); primary lg full Sign in (mt 8); or-divider (1px line flanks, 12 fgSubtle); two secondary full OAuth buttons with Apple/Chrome icons (15); bottom-anchored centered footer (padding 24/0/40, 13 fgSubtle, accent cta) wired to `router.push('/(auth)/signup')`-less for M1 — the mobile sign-up screen is **not** in M1 scope (board has no mobile sign-up frame; account creation on mobile goes through OAuth/web for now — log in decisions.md); render the footer text non-interactive.

All error states display via `Field`'s `error` prop using strings.

- [ ] **Step 4: Component test** — renders the five strings-driven controls (email, password, sign in, both OAuth buttons) and the forgot link; submit path calls the mocked client.

- [ ] **Step 5: Run** tests PASS; boot the simulator and visually sanity-check. **Step 6: Commit** — `git commit -m "feat(mobile): board §00 login screen"`

---

### Task 16: Mobile capture + local Maestro flow (gate frame 2/2)

**Files:**
- Create: `e2e/mobile/sign-in.yaml`
- Modify: `docs/checklists/m1-auth.md`

- [ ] **Step 1: Pin the simulator.** Choose the current iPhone Pro simulator (e.g. iPhone 16 Pro, latest iOS); record name + iOS version in `docs/checklists/m1-auth.md`.

- [ ] **Step 2: Capture.**

```bash
xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100
# app open on the login screen, then:
xcrun simctl io booted screenshot tools/design-fidelity/output/app/marketing-auth--mobile-login.png
```

Side-by-side against `references/marketing-auth--mobile-login.png` (the compare report renders both even when pixelmatch is meaningless at mismatched dimensions — if `compare.ts` hard-fails on size mismatch, view them manually side by side instead). **Gate = human approval of layout/spacing/type/color.** Iterate, then record approval in the checklist.

- [ ] **Step 3: Maestro flow** (`e2e/mobile/sign-in.yaml`) — run locally once, record the result in the checklist (CI execution deferred):

```yaml
appId: com.pantrycopilot.app # match app.json ios.bundleIdentifier
---
- launchApp
- assertVisible: 'Welcome back'
- tapOn: 'Email'
- inputText: 'maestro@example.com'
- tapOn: 'Password'
- inputText: 'hunter2hunter2'
- tapOn: 'Sign in'
- assertVisible: 'Home'
```

(The user must exist: create it first via `curl -X POST localhost:4000/api/auth/sign-up/email -H 'content-type: application/json' -d '{"name":"Maestro","email":"maestro@example.com","password":"hunter2hunter2"}'`.)

- [ ] **Step 4: Commit** — `git commit -m "test(mobile): login fidelity approval + local maestro flow"`

---

### Task 17: Close-out — decisions, docs, roadmap, full gate

**Files:**
- Modify: `docs/decisions.md`, `docs/checklists/m1-auth.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md`

- [ ] **Step 1: decisions.md entries (dated 2026-06-XX, M1):**
- Auth scope: board-faithful email/password + conditional Google/Apple; magic link plumbing-only (no UI), doubles as dev/e2e bootstrap behind `AUTH_DEV_MAGIC_LINK` (env schema rejects it in production); no dev auto-login.
- Web sign-up screen composed from primitives (board-silent); **mobile sign-up deferred** (no board frame; footer link non-interactive in M1).
- `packages/contracts` deferred to M2 (no shared DTO in M1); `packages/api-client` is tRPC-client-only, Better Auth clients live per-app.
- Ephemeral-postgres strategy (per-file CREATE DATABASE + drizzle migrate; compose locally, service container in CI; no testcontainers; never `db push`).
- Cookies `sameSite: lax` in dev (same-site localhost ports); prod attributes env-driven later. Note whether v2's `stripSessionToken` was adopted (only if verified compatible with the expo client's token delivery — otherwise dropped, and why).
- Mobile fidelity: pixelmatch non-gate (390×800 board frame matches no device); pinned simulator recorded; Maestro local-only.
- Native batch-1 primitives shipped (closes M0 deferral); native Pill deferred to M2.
- Web Containerfile deferred until web deploys.
- Any font fallback taken (woff2 vs TTF static instances).

- [ ] **Step 2: CLAUDE.md** — note `pnpm test` now needs the compose postgres: add to Commands: `podman compose -f infra/podman/compose.yaml up -d` before `pnpm test`.

- [ ] **Step 3: Full gate (superpowers:verification-before-completion):**

```bash
podman compose -f infra/podman/compose.yaml up -d --build
curl -fsS localhost:4000/health && curl -fsS localhost:4000/ready
pnpm lint && pnpm typecheck && pnpm test && pnpm -r build
pnpm --filter @pantry/e2e-web e2e
```

All green + both frames approved in `docs/checklists/m1-auth.md` + CI green on the branch.

- [ ] **Step 4: Roadmap** — Status table: M1 → done with plan link; M2 → in progress, plan pending.

- [ ] **Step 5: Commit** — `git commit -m "docs: M1 complete; roadmap status updated"`

---

## Verification (milestone gate, from the roadmap)

1. **2 login frames matched:** `docs/checklists/m1-auth.md` shows Web · Login approved (with pixelmatch baseline %) and Mobile · Login approved (human side-by-side).
2. **e2e sign-in:** `e2e/web/specs/auth.spec.ts` green locally and in CI.
3. **API integration tests vs ephemeral postgres in CI:** the checks job runs `@pantry/api` integration suites against the postgres service container.
4. `podman compose up` boots postgres + api with `/ready` → 200.
5. Repo gates: `pnpm lint` (zero warnings), `pnpm typecheck`, `pnpm test`, `pnpm -r build` all pass.

## Known version-sensitive seams (verify against installed versions, don't guess)

- TanStack Start: vite plugin import path, `createServerFn` shape, request-header access API.
- Better Auth: `advanced.database.generateId` shape; magic-link server API name (`auth.api.signInMagicLink`); session cookie name in assertions.
- Expo: SDK version chosen by `create-expo-app` at install time; `src/app` router dir; woff2 font loading on iOS.
- tRPC v11: `fastifyTRPCPlugin` options shape; unauthenticated error surfacing (HTTP status vs envelope).
