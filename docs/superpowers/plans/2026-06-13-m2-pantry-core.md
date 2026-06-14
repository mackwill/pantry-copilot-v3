# M2 — Pantry Core (Manual Entry) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **On completion:** link this plan in the roadmap Status table (replace "plan pending" for M2) and commit.

**Goal:** Ship the pantry-core manual-entry slice — pantry CRUD with an inventory event log, expiration ranking, and the 10 board frames across web (Inventory, Ingredient form, Account) and mobile (Pantry tap-to-cook, Add/Edit ingredient, Category/Location/Best-by picker sheets, Account shell).

**Architecture:** Vertical slice following the roadmap order **contracts → DB/API → web UI → mobile UI → screenshot gate → e2e**. Two new workspace packages get created on first use (`@pantry/contracts` as the Zod source of truth, `@pantry/utils` for pure expiration/quantity logic). Pantry data flows `web/mobile —tRPC→ api —Drizzle→ postgres`; every mutation writes an `inventory_events` row in the same transaction. UI screens reuse existing design-system primitives; net-new visual pieces are added to the design system, never invented inline.

**Tech Stack:** Zod · Drizzle + PostgreSQL · Fastify + tRPC · TanStack Router + CSS Modules (web) · Expo Router + React Native (mobile) · Vitest + Testing Library + Playwright + Maestro · pixelmatch fidelity harness.

---

## Context

M1 delivered auth + app shells (login frames approved, tab skeleton, `user.me`). The repo currently has **zero TypeScript errors** (`pnpm typecheck` green across all 9 workspaces, verified 2026-06-13) and no `packages/contracts` or `packages/utils` yet — M1 kept its single DTO inline in the API. M2 is the first feature milestone with real domain data, so it establishes the contracts + utils packages the roadmap's monorepo layout mandates, then builds the pantry on top.

**Why now:** The pantry is the foundation every later milestone reads from (scan confirms into it, generation reads chips from it, cook sessions deduct from it). Getting the schema, enums, event log, and expiration ranking right here — with tests and screenshot fidelity — prevents the v2 drift the rewrite exists to avoid.

**"Clean up TS errors":** typecheck is already at zero. The plan therefore treats `pnpm typecheck` (and `pnpm lint --max-warnings 0`) as a **standing gate run before every commit** rather than an upfront fix. Any error introduced during M2 is fixed in the task that introduced it — never deferred, never suppressed (`eslint-disable`/`any`/`@ts-expect-error` are all banned).

### Scope decisions (settled with user 2026-06-13)

- **Account screens = display-only shells.** Avatar/name/email wire to the real session user (`api.user.me`); preference, stat, and subscription rows render board content as static display-only data. Editable preferences and a `user_preferences` table are deferred to a later milestone. Log in `docs/decisions.md`.
- **Mobile tap-to-cook tray = full selection, stubbed Cook action.** The tap-to-select tray and selection state are implemented and tested; the `Cook` button renders per board but its press is a no-op placeholder until M4 wires generation. Log in `docs/decisions.md`.
- **Recipe detail frame is NOT in M2.** The explorer surfaced a "Mobile Recipe detail" frame under §07; the roadmap assigns recipe detail to **M5**. M2 ships **10 frames** (3 web + 7 mobile).

### The 10 M2 frames

| # | Frame label (board) | Section | Platform |
| - | ------------------- | ------- | -------- |
| 1 | Web · Inventory (full pantry) | §05 | web |
| 2 | Web · Ingredient form | §06 | web |
| 3 | Web · User account | §06 | web |
| 4 | Pantry (tap-to-cook) | §07 | mobile |
| 5 | Add ingredient | §09 | mobile |
| 6 | Edit ingredient | §09 | mobile |
| 7 | Category picker | §09.5 | mobile |
| 8 | Location picker | §09.5 | mobile |
| 9 | Best-by picker | §09.5 | mobile |
| 10 | Account | §10 | mobile |

Board source frames (v2, reference-only): `claudeDesignOutput/components/web-screens-b.jsx` (web), `mobile-screens-a.jsx` / `mobile-screens-b.jsx` (mobile), `components/bottom-sheet.jsx` (picker sheets).

---

## Domain model (single source of truth — used by every task below)

These enum value sets come straight from the board. They live in `@pantry/contracts` and are reused verbatim by DB enums, API validation, and UI option lists. **Do not redefine them anywhere else — import them.**

```ts
// Category — board category picker (§09.5)
export const PANTRY_CATEGORIES = ['produce', 'dairy', 'pantry', 'protein', 'freezer', 'drinks', 'treats'] as const;

// Location — board location picker (§09.5)
export const PANTRY_LOCATIONS = [
  'fridge_top', 'fridge_door', 'fridge_crisper', 'freezer',
  'pantry_upper', 'pantry_lower', 'counter',
] as const;

// Unit — board quantity unit pills + form units
export const PANTRY_UNITS = [
  'ea', 'g', 'kg', 'lb', 'oz', 'cup', 'tbsp', 'tsp',
  'gallon', 'stick', 'pack', 'jar', 'tin', 'bottle', 'bunch', 'head', 'bag',
] as const;

// Freshness tone — derived, not stored. status dot/pill color on inventory + pantry.
export const FRESHNESS_TONES = ['success', 'warning', 'danger'] as const;

// Inventory event kind — the event log (design call, logged in decisions.md)
export const INVENTORY_EVENT_KINDS = ['added', 'edited', 'removed', 'adjusted'] as const;
```

**Display labels** (board copy → enum) live in each feature's `strings.ts`, mapped from these enums. The enum is the wire/storage value; the label is the UI string. Example: `dairy` → "Dairy", `fridge_top` → "Fridge — top shelf".

---

## New package wiring (do this first, in Slice A)

Both packages follow the existing `packages/config` conventions: `package.json` with `name`, `type: module`, `exports`, `typecheck`/`test` scripts; `tsconfig.json` extending `../../tsconfig.base.json`; Vitest for tests. Add each as a workspace dep where consumed (`@pantry/contracts` → api, api-client transitively, web, mobile; `@pantry/utils` → contracts consumers as needed). Use `workspace:*` and run `pnpm install` after adding.

---

# Slice A — Contracts + enums + expiration utils

**Files:**
- Create: `packages/contracts/package.json`, `packages/contracts/tsconfig.json`, `packages/contracts/vitest.config.ts`
- Create: `packages/contracts/src/index.ts`, `packages/contracts/src/pantry/enums.ts`, `packages/contracts/src/pantry/item.ts`, `packages/contracts/src/pantry/events.ts`
- Test: `packages/contracts/src/pantry/item.test.ts`
- Create: `packages/utils/package.json`, `packages/utils/tsconfig.json`, `packages/utils/vitest.config.ts`, `packages/utils/src/index.ts`, `packages/utils/src/expiration.ts`
- Test: `packages/utils/src/expiration.test.ts`

### Task A1: Scaffold `@pantry/contracts` package

- [ ] **Step 1: Create `packages/contracts/package.json`**

```json
{
  "name": "@pantry/contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": { "zod": "<copy exact version pinned in services/api>" },
  "devDependencies": { "vitest": "<copy exact version used in repo>" }
}
```

- [ ] **Step 2: Create `packages/contracts/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/contracts/vitest.config.ts`** mirroring `packages/config`'s vitest config (node environment).

- [ ] **Step 4: Run `pnpm install`** so the workspace link resolves.

Run: `pnpm install`
Expected: lockfile updates, `@pantry/contracts` linked, no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts pnpm-lock.yaml
git commit -m "chore(contracts): scaffold @pantry/contracts package"
```

### Task A2: Pantry enums

- [ ] **Step 1: Write the failing test** `packages/contracts/src/pantry/item.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { PANTRY_CATEGORIES, PANTRY_LOCATIONS, PANTRY_UNITS, pantryCategorySchema } from '../index';

describe('pantry enums', () => {
  it('exposes the 7 board categories', () => {
    expect(PANTRY_CATEGORIES).toEqual(['produce', 'dairy', 'pantry', 'protein', 'freezer', 'drinks', 'treats']);
  });
  it('exposes the 7 board locations', () => {
    expect(PANTRY_LOCATIONS).toContain('fridge_top');
    expect(PANTRY_LOCATIONS).toHaveLength(7);
  });
  it('rejects an unknown category', () => {
    expect(pantryCategorySchema.safeParse('vegetables').success).toBe(false);
    expect(pantryCategorySchema.safeParse('dairy').success).toBe(true);
  });
  it('exposes units including gallon and bunch', () => {
    expect(PANTRY_UNITS).toContain('gallon');
    expect(PANTRY_UNITS).toContain('bunch');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @pantry/contracts test`
Expected: FAIL — cannot resolve `../index` exports.

- [ ] **Step 3: Implement `packages/contracts/src/pantry/enums.ts`**

```ts
import { z } from 'zod';

export const PANTRY_CATEGORIES = ['produce', 'dairy', 'pantry', 'protein', 'freezer', 'drinks', 'treats'] as const;
export const PANTRY_LOCATIONS = [
  'fridge_top', 'fridge_door', 'fridge_crisper', 'freezer', 'pantry_upper', 'pantry_lower', 'counter',
] as const;
export const PANTRY_UNITS = [
  'ea', 'g', 'kg', 'lb', 'oz', 'cup', 'tbsp', 'tsp',
  'gallon', 'stick', 'pack', 'jar', 'tin', 'bottle', 'bunch', 'head', 'bag',
] as const;
export const FRESHNESS_TONES = ['success', 'warning', 'danger'] as const;
export const INVENTORY_EVENT_KINDS = ['added', 'edited', 'removed', 'adjusted'] as const;

export const pantryCategorySchema = z.enum(PANTRY_CATEGORIES);
export const pantryLocationSchema = z.enum(PANTRY_LOCATIONS);
export const pantryUnitSchema = z.enum(PANTRY_UNITS);
export const freshnessToneSchema = z.enum(FRESHNESS_TONES);
export const inventoryEventKindSchema = z.enum(INVENTORY_EVENT_KINDS);

export type PantryCategory = z.infer<typeof pantryCategorySchema>;
export type PantryLocation = z.infer<typeof pantryLocationSchema>;
export type PantryUnit = z.infer<typeof pantryUnitSchema>;
export type FreshnessTone = z.infer<typeof freshnessToneSchema>;
export type InventoryEventKind = z.infer<typeof inventoryEventKindSchema>;
```

- [ ] **Step 4: Create `packages/contracts/src/index.ts`** re-exporting `./pantry/enums`, `./pantry/item`, `./pantry/events` (add the latter two as they're created).

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @pantry/contracts test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/contracts/src
git commit -m "feat(contracts): pantry category/location/unit/event enums"
```

### Task A3: Pantry item + input DTOs

- [ ] **Step 1: Add failing tests** to `item.test.ts`

```ts
import { createPantryItemInput, pantryItemSchema, updatePantryItemInput } from '../index';

describe('pantry item DTOs', () => {
  const valid = {
    name: 'Whole milk', brand: 'Strauss', quantity: 0.5, unit: 'gallon',
    category: 'dairy', location: 'fridge_top',
    purchasedAt: '2026-04-16', bestBy: '2026-04-23', notes: null,
  };
  it('accepts a valid create input', () => {
    expect(createPantryItemInput.safeParse(valid).success).toBe(true);
  });
  it('requires a non-empty name', () => {
    expect(createPantryItemInput.safeParse({ ...valid, name: '' }).success).toBe(false);
  });
  it('rejects negative quantity', () => {
    expect(createPantryItemInput.safeParse({ ...valid, quantity: -1 }).success).toBe(false);
  });
  it('update input requires an id and allows partial fields', () => {
    expect(updatePantryItemInput.safeParse({ id: crypto.randomUUID(), name: 'Skim milk' }).success).toBe(true);
    expect(updatePantryItemInput.safeParse({ name: 'Skim milk' }).success).toBe(false);
  });
  it('full item schema includes server fields', () => {
    const item = { ...valid, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    expect(pantryItemSchema.safeParse(item).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify fail.** `pnpm --filter @pantry/contracts test` → FAIL.

- [ ] **Step 3: Implement `packages/contracts/src/pantry/item.ts`**

```ts
import { z } from 'zod';
import { pantryCategorySchema, pantryLocationSchema, pantryUnitSchema } from './enums';

// ISO date (YYYY-MM-DD) for purchasedAt/bestBy; null when not tracked.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const createPantryItemInput = z.object({
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(120).nullable().default(null),
  quantity: z.number().nonnegative(),
  unit: pantryUnitSchema,
  category: pantryCategorySchema,
  location: pantryLocationSchema,
  purchasedAt: isoDate.nullable().default(null),
  bestBy: isoDate.nullable().default(null),
  notes: z.string().trim().max(2000).nullable().default(null),
});

export const updatePantryItemInput = createPantryItemInput.partial().extend({ id: z.string().uuid() });

export const pantryItemSchema = createPantryItemInput.extend({
  id: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInput>;
export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInput>;
export type PantryItem = z.infer<typeof pantryItemSchema>;
```

- [ ] **Step 4: Run to verify pass.** `pnpm --filter @pantry/contracts test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src
git commit -m "feat(contracts): pantry item create/update/item DTOs"
```

### Task A4: Inventory event DTO

- [ ] **Step 1: Add failing test** `packages/contracts/src/pantry/events.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { inventoryEventSchema } from '../index';

describe('inventory event', () => {
  it('accepts an added event with a snapshot', () => {
    const ev = {
      id: crypto.randomUUID(), itemId: crypto.randomUUID(), kind: 'added',
      quantityDelta: 1, createdAt: new Date().toISOString(),
    };
    expect(inventoryEventSchema.safeParse(ev).success).toBe(true);
  });
  it('rejects an unknown kind', () => {
    const ev = { id: crypto.randomUUID(), itemId: crypto.randomUUID(), kind: 'teleported', quantityDelta: 0, createdAt: new Date().toISOString() };
    expect(inventoryEventSchema.safeParse(ev).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `packages/contracts/src/pantry/events.ts`**

```ts
import { z } from 'zod';
import { inventoryEventKindSchema } from './enums';

export const inventoryEventSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  kind: inventoryEventKindSchema,
  quantityDelta: z.number(),
  createdAt: z.string(),
});

export type InventoryEvent = z.infer<typeof inventoryEventSchema>;
```

Add `export * from './pantry/events';` to `src/index.ts`.

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add packages/contracts/src
git commit -m "feat(contracts): inventory event DTO"
```

### Task A5: Scaffold `@pantry/utils` + expiration ranking

The board renders a freshness **tone** (success/warning/danger) and a human label ("2 days", "overripe", "6 mo"). This is pure logic — the roadmap mandates it live in `packages/utils`, unit-tested.

- [ ] **Step 1: Scaffold the package** — `package.json` (name `@pantry/utils`, deps `@pantry/contracts: workspace:*`), `tsconfig.json`, `vitest.config.ts`, mirroring Task A1. Run `pnpm install`.

- [ ] **Step 2: Write the failing test** `packages/utils/src/expiration.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { freshnessFor, rankByExpiration } from './expiration';

const today = new Date('2026-04-21T12:00:00Z');

describe('freshnessFor', () => {
  it('flags danger when past best-by', () => {
    expect(freshnessFor('2026-04-19', today).tone).toBe('danger');
  });
  it('flags warning within 3 days', () => {
    const f = freshnessFor('2026-04-23', today);
    expect(f.tone).toBe('warning');
    expect(f.daysLeft).toBe(2);
  });
  it('flags success when comfortably fresh', () => {
    expect(freshnessFor('2026-05-30', today).tone).toBe('success');
  });
  it('returns success/untracked when bestBy is null', () => {
    expect(freshnessFor(null, today).tone).toBe('success');
  });
});

describe('rankByExpiration', () => {
  it('orders danger first, then soonest best-by, untracked last', () => {
    const items = [
      { id: 'a', bestBy: null },
      { id: 'b', bestBy: '2026-04-19' },
      { id: 'c', bestBy: '2026-04-23' },
    ];
    expect(rankByExpiration(items, today).map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });
});
```

- [ ] **Step 3: Run → FAIL.** `pnpm --filter @pantry/utils test`

- [ ] **Step 4: Implement `packages/utils/src/expiration.ts`**

```ts
import type { FreshnessTone } from '@pantry/contracts';

const DAY_MS = 86_400_000;
const WARNING_DAYS = 3;

export interface Freshness {
  tone: FreshnessTone;
  daysLeft: number | null; // null when untracked
}

export function freshnessFor(bestBy: string | null, now: Date = new Date()): Freshness {
  if (bestBy === null) return { tone: 'success', daysLeft: null };
  const due = new Date(`${bestBy}T00:00:00Z`).getTime();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
  const daysLeft = Math.round((due - start) / DAY_MS);
  if (daysLeft < 0) return { tone: 'danger', daysLeft };
  if (daysLeft <= WARNING_DAYS) return { tone: 'warning', daysLeft };
  return { tone: 'success', daysLeft };
}

const TONE_RANK: Record<FreshnessTone, number> = { danger: 0, warning: 1, success: 2 };

export function rankByExpiration<T extends { bestBy: string | null }>(items: readonly T[], now: Date = new Date()): T[] {
  return [...items].sort((a, b) => {
    const fa = freshnessFor(a.bestBy, now);
    const fb = freshnessFor(b.bestBy, now);
    if (TONE_RANK[fa.tone] !== TONE_RANK[fb.tone]) return TONE_RANK[fa.tone] - TONE_RANK[fb.tone];
    if (fa.daysLeft === null) return 1;
    if (fb.daysLeft === null) return -1;
    return fa.daysLeft - fb.daysLeft;
  });
}
```

Export from `packages/utils/src/index.ts`: `export * from './expiration';`

- [ ] **Step 5: Run → PASS. Run full gates.**

Run: `pnpm --filter @pantry/utils test && pnpm typecheck && pnpm lint`
Expected: all green, 0 warnings.

- [ ] **Step 6: Commit**

```bash
git add packages/utils pnpm-lock.yaml
git commit -m "feat(utils): freshness tone + expiration ranking (pure, tested)"
```

---

# Slice B — DB schema + migration

**Files:**
- Create: `services/api/src/db/schema/pantry.ts`
- Modify: `services/api/src/db/schema/index.ts` (barrel export)
- Generated: `services/api/drizzle/0001_*.sql` + meta

Reference (consult, never copy): v2 `services/api/src/db/schema.ts` `pantry_items` / `inventory_events`.

### Task B1: Pantry tables

- [ ] **Step 1: Create `services/api/src/db/schema/pantry.ts`**

```ts
import { numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  INVENTORY_EVENT_KINDS, PANTRY_CATEGORIES, PANTRY_LOCATIONS, PANTRY_UNITS,
} from '@pantry/contracts';
import { users } from './auth.js';

export const pantryCategory = pgEnum('pantry_category', PANTRY_CATEGORIES);
export const pantryLocation = pgEnum('pantry_location', PANTRY_LOCATIONS);
export const pantryUnit = pgEnum('pantry_unit', PANTRY_UNITS);
export const inventoryEventKind = pgEnum('inventory_event_kind', INVENTORY_EVENT_KINDS);

export const pantryItems = pgTable('pantry_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  brand: text('brand'),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unit: pantryUnit('unit').notNull(),
  category: pantryCategory('category').notNull(),
  location: pantryLocation('location').notNull(),
  purchasedAt: text('purchased_at'), // ISO YYYY-MM-DD
  bestBy: text('best_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const inventoryEvents = pgTable('inventory_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => pantryItems.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: inventoryEventKind('kind').notNull(),
  quantityDelta: numeric('quantity_delta', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

> Note: `quantity`/`quantityDelta` are `numeric` → Drizzle returns strings. The router maps to/from `number` at the boundary (Task C2). Keep enum arrays imported from `@pantry/contracts` so DB and wire never drift.

- [ ] **Step 2: Add to barrel** `services/api/src/db/schema/index.ts`: `export * from './pantry.js';`

- [ ] **Step 3: Generate the migration**

Run: `pnpm --filter @pantry/api db:generate`
Expected: new `drizzle/0001_*.sql` creating 4 enums + 2 tables + FKs; `_journal.json` gains an entry.

- [ ] **Step 4: Apply against the dev DB and typecheck**

Run: `podman compose -f infra/podman/compose.yaml up -d && pnpm --filter @pantry/api db:migrate && pnpm typecheck`
Expected: migration applies; typecheck green.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/db services/api/drizzle
git commit -m "feat(api): pantry_items + inventory_events schema and migration"
```

---

# Slice C — API: pantry router (CRUD + event log)

**Files:**
- Create: `services/api/src/trpc/routers/pantry.ts`
- Modify: `services/api/src/trpc/router.ts` (mount `pantry`)
- Test: `services/api/test/pantry.integration.test.ts`

Follow the M1 tRPC patterns: `protectedProcedure`, `ctx.db`, `ctx.session.user.id`. Integration tests use the existing `createTestDb()` helper + `app.inject()` + cookie auth (mirror `test/trpc.integration.test.ts`).

### Task C1: Failing integration test for create + list

- [ ] **Step 1: Write `services/api/test/pantry.integration.test.ts`**

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server.js';
import { createDeps } from '../src/deps.js';
import { createTestDb, type TestDb } from './helpers/test-db.js';
import { cookieOf, signUp } from './helpers/auth.js'; // signUp: extract from M1 test or add helper

describe('pantry router', () => {
  let testDb: TestDb; let app: FastifyInstance; let cookie: string;

  beforeAll(async () => {
    testDb = await createTestDb();
    app = await buildServer(createDeps({ /* env */ DATABASE_URL: testDb.url }));
    cookie = cookieOf(await signUp(app, { name: 'Mara', email: 'mara@example.com', password: 'hunter2hunter2' }));
  });
  afterAll(() => testDb.drop());

  const milk = {
    name: 'Whole milk', brand: 'Strauss', quantity: 0.5, unit: 'gallon',
    category: 'dairy', location: 'fridge_top', purchasedAt: '2026-04-16', bestBy: '2026-04-23', notes: null,
  };

  const trpc = (path: string, input: unknown) =>
    app.inject({ method: 'POST', url: `/trpc/${path}`, headers: { cookie, 'content-type': 'application/json' }, payload: { json: input } });

  it('creates an item and lists it back', async () => {
    const created = await trpc('pantry.create', milk);
    expect(created.statusCode).toBe(200);
    const list = await app.inject({ method: 'GET', url: '/trpc/pantry.list', headers: { cookie } });
    expect(list.body).toContain('Whole milk');
  });

  it('is UNAUTHORIZED without a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/trpc/pantry.list' });
    expect(res.statusCode).toBe(401);
  });
});
```

> If `signUp`/`cookieOf` helpers don't already exist as shared helpers, extract them from `test/trpc.integration.test.ts` into `test/helpers/auth.ts` as a prerequisite step and update the M1 test to import them (DRY).

- [ ] **Step 2: Run → FAIL** (`pantry.*` procedures don't exist).

Run: `pnpm --filter @pantry/api test`

### Task C2: Implement the pantry router

- [ ] **Step 1: Create `services/api/src/trpc/routers/pantry.ts`**

```ts
import { and, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  createPantryItemInput, updatePantryItemInput, type PantryItem,
} from '@pantry/contracts';
import { z } from 'zod';
import { inventoryEvents, pantryItems } from '../../db/schema/index.js';
import { protectedProcedure, router } from '../init.js';

// numeric columns come back as strings; map at the boundary.
const toDto = (row: typeof pantryItems.$inferSelect): PantryItem => ({
  id: row.id, name: row.name, brand: row.brand, quantity: Number(row.quantity),
  unit: row.unit, category: row.category, location: row.location,
  purchasedAt: row.purchasedAt, bestBy: row.bestBy, notes: row.notes,
  createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
});

export const pantryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(pantryItems)
      .where(eq(pantryItems.userId, ctx.session.user.id))
      .orderBy(desc(pantryItems.createdAt));
    return rows.map(toDto);
  }),

  create: protectedProcedure.input(createPantryItemInput).mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
      const [row] = await tx.insert(pantryItems).values({
        userId: ctx.session.user.id, ...input, quantity: String(input.quantity),
      }).returning();
      await tx.insert(inventoryEvents).values({
        itemId: row.id, userId: ctx.session.user.id, kind: 'added', quantityDelta: String(input.quantity),
      });
      return toDto(row);
    });
  }),

  update: protectedProcedure.input(updatePantryItemInput).mutation(async ({ ctx, input }) => {
    const { id, quantity, ...rest } = input;
    return ctx.db.transaction(async (tx) => {
      const [row] = await tx.update(pantryItems)
        .set({ ...rest, ...(quantity === undefined ? {} : { quantity: String(quantity) }) })
        .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, ctx.session.user.id)))
        .returning();
      if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
      await tx.insert(inventoryEvents).values({ itemId: id, userId: ctx.session.user.id, kind: 'edited', quantityDelta: '0' });
      return toDto(row);
    });
  }),

  remove: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
      const [row] = await tx.select().from(pantryItems)
        .where(and(eq(pantryItems.id, input.id), eq(pantryItems.userId, ctx.session.user.id)));
      if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
      await tx.delete(pantryItems).where(eq(pantryItems.id, input.id));
      return { id: input.id };
    });
  }),
});
```

(Note: the `removed` event is intentionally not persisted because `inventory_events.itemId` cascades on item delete — record this nuance in `docs/decisions.md`: deletion is logged via the removal itself; if an audit trail outliving the item is needed later, drop the FK cascade or null the FK. Out of scope for M2.)

- [ ] **Step 2: Mount in `services/api/src/trpc/router.ts`**: add `pantry: pantryRouter` to `appRouter`.

- [ ] **Step 3: Run → PASS.** `pnpm --filter @pantry/api test`

- [ ] **Step 4: Commit**

```bash
git add services/api/src services/api/test
git commit -m "feat(api): pantry CRUD router with inventory event log"
```

### Task C3: Integration tests for update + delete

- [ ] **Step 1: Add `update` and `remove` cases** to `pantry.integration.test.ts`:

```ts
it('updates an item and writes an edited event', async () => {
  const created = JSON.parse((await trpc('pantry.create', milk)).body);
  const id = created.result.data.json.id;
  const updated = await trpc('pantry.update', { id, quantity: 1, name: 'Skim milk' });
  expect(updated.statusCode).toBe(200);
  expect(updated.body).toContain('Skim milk');
});

it('removes an item', async () => {
  const created = JSON.parse((await trpc('pantry.create', milk)).body);
  const id = created.result.data.json.id;
  expect((await trpc('pantry.remove', { id })).statusCode).toBe(200);
});

it('forbids updating another user\'s item', async () => {
  const created = JSON.parse((await trpc('pantry.create', milk)).body);
  const id = created.result.data.json.id;
  const otherCookie = cookieOf(await signUp(app, { name: 'X', email: 'x@example.com', password: 'hunter2hunter2' }));
  const res = await app.inject({ method: 'POST', url: '/trpc/pantry.update',
    headers: { cookie: otherCookie, 'content-type': 'application/json' }, payload: { json: { id, name: 'Hax' } } });
  expect(res.statusCode).toBe(404);
});
```

- [ ] **Step 2: Run → PASS. Run all gates.**

Run: `pnpm --filter @pantry/api test && pnpm typecheck && pnpm lint`

- [ ] **Step 3: Commit**

```bash
git add services/api/test
git commit -m "test(api): pantry update/delete + ownership isolation"
```

---

# Slice D — Web: Inventory screen (frame 1, §05)

**Files:**
- Create route: `apps/web/src/routes/_authed/pantry.tsx` (composition-only, <100 lines)
- Create: `apps/web/src/features/inventory/strings.ts`, `useInventory.ts`, `inventory.module.css`
- Create: `apps/web/src/features/inventory/components/InventoryScreen.tsx`, `InventoryHeader.tsx`, `InventoryStats.tsx`, `CategoryFilter.tsx`, `InventoryTable.tsx`
- Design system (if a primitive is missing): add `StatusDot`/`StatusPill` to `packages/design-system/src/web` and gallery — **only if** an existing primitive (Pill/Badge) can't express the tone dots. Check `Pill` first; reuse if possible.
- Test: `apps/web/src/features/inventory/InventoryTable.test.tsx`, `useInventory.test.ts`

Board reference: `web-screens-b.jsx:4-96`. Wire through `api.pantry.list`. Use `WebShell` for the nav frame (active id `pantry`). Use `@pantry/utils` `freshnessFor` for status tone + `rankByExpiration` for "Needs using" ordering. Strings → all board copy ("Inventory", "Your pantry", "Total items", "Expiring this week", "Past prime", column headers "Item/Qty/Category/Location/Status/Added", buttons "Import/Scan/Add ingredient", category pills "All/Produce/Dairy/Pantry/Freezer/Spice"). Map enum→label in strings.

### Task D1: strings + label maps

- [ ] **Step 1: Create `apps/web/src/features/inventory/strings.ts`** with the board copy and enum→label maps:

```ts
import type { PantryCategory, PantryLocation } from '@pantry/contracts';

export const inventoryStrings = {
  eyebrow: 'Inventory',
  title: 'Your pantry',
  stats: { total: 'Total items', expiring: 'Expiring this week', pastPrime: 'Past prime' },
  columns: { item: 'Item', qty: 'Qty', category: 'Category', location: 'Location', status: 'Status', added: 'Added' },
  actions: { import: 'Import', scan: 'Scan', add: 'Add ingredient', search: 'Search', filter: 'Filter' },
  filterAll: 'All',
  empty: 'Nothing here yet. Add your first ingredient.',
} as const;

export const categoryLabels: Record<PantryCategory, string> = {
  produce: 'Produce', dairy: 'Dairy', pantry: 'Pantry', protein: 'Protein',
  freezer: 'Freezer', drinks: 'Drinks', treats: 'Treats',
};
export const locationLabels: Record<PantryLocation, string> = {
  fridge_top: 'Fridge — top shelf', fridge_door: 'Fridge — door', fridge_crisper: 'Fridge — crisper',
  freezer: 'Freezer', pantry_upper: 'Pantry — upper', pantry_lower: 'Pantry — lower', counter: 'Counter',
};
```

> These label maps are reused by the ingredient form (Slice E) and mobile (Slices G–H). Put them in `features/inventory/strings.ts` and import, OR — if cleaner — promote to a shared `apps/web/src/features/pantry-shared/labels.ts`. Pick one home; do not duplicate.

- [ ] **Step 2: Commit** (strings only is fine).

### Task D2: useInventory hook + test

- [ ] **Step 1: Write failing `useInventory.test.ts`** — mock `api.pantry.list` returning two board items, assert the hook returns derived stats (total count, expiring count via `freshnessFor`), the active category filter, and filtered rows. Mirror the M1 `useLogin.test.ts` mocking style.

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `useInventory.ts`** — load via TanStack Router loader data or `api.pantry.list.query()`; hold `activeCategory` state; derive `stats` and `visibleItems` with `@pantry/utils`. Keep <100 lines.

- [ ] **Step 4: Run → PASS. Commit.**

### Task D3: Presentational components + InventoryTable test

- [ ] **Step 1: Write failing `InventoryTable.test.tsx`** — render with two fixture rows; assert board column headers present, item names render, status tone class applied for a warning item (`getByText('Whole milk')`, status pill text). Use Testing Library per M1 pattern.

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement components** — `InventoryScreen` composes header + stats + filter + table inside `WebShell`; each subcomponent ≤200 lines, presentational, strings from `inventoryStrings`, styles from `inventory.module.css` using `var(--token)` values. Status dot/pill color keyed off `freshnessFor(...).tone`.

- [ ] **Step 4: Create route `apps/web/src/routes/_authed/pantry.tsx`** — composition only:

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { api } from '../../lib/api';
import { InventoryScreen } from '../../features/inventory/components/InventoryScreen';

export const Route = createFileRoute('/_authed/pantry')({
  ssr: false,
  loader: () => api.pantry.list.query(),
  component: () => <InventoryScreen items={Route.useLoaderData()} />,
});
```

- [ ] **Step 5: Run tests + gates → PASS.**

Run: `pnpm --filter @pantry/web test && pnpm typecheck && pnpm lint`

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/features/inventory apps/web/src/routes/_authed/pantry.tsx packages/design-system
git commit -m "feat(web): inventory screen (board §05)"
```

---

# Slice E — Web: Ingredient form (frame 2, §06)

**Files:**
- Create route: `apps/web/src/routes/_authed/pantry.$itemId.tsx`
- Create: `apps/web/src/features/ingredient-form/strings.ts`, `useIngredientForm.ts`, `ingredient-form.module.css`
- Create components: `IngredientFormScreen.tsx`, `IngredientFields.tsx`, `FreshnessCard.tsx` (right sidebar), `UseItInCard.tsx`, `BoughtCard.tsx`
- Test: `apps/web/src/features/ingredient-form/useIngredientForm.test.ts`, `IngredientFields.test.tsx`

Board ref `web-screens-b.jsx:216-318`. Left = 2×2 field grid (Name/Brand/Quantity/Unit/Category/Location/Purchased/Best by/Notes) + Save/Cancel/Remove buttons. Right sidebar = Freshness, "Use it in" (3 static recipe rows — display only this milestone), "Bought" (auto-add pills, display only). Reuse `Field`/`Input`/`Button` primitives + `categoryLabels`/`locationLabels` from Slice D. Wire Save → `api.pantry.update`, Remove → `api.pantry.remove` then navigate to `/pantry`.

### Task E1: strings + useIngredientForm (+ tests)

- [ ] **Step 1: Failing `useIngredientForm.test.ts`** — mock `api.pantry.update`/`remove`; assert field state init from a loaded item, `save()` calls update with mapped numeric quantity, `remove()` calls remove + navigates.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `strings.ts`** (board labels: "Ingredient", "Save changes", "Cancel", "Remove from pantry", field labels, "Use it in", "Bought", "Roughly every 11 days", "Auto-add/Off") and `useIngredientForm.ts` (form state + save/remove, ≤200 lines, state machine in the hook not JSX).
- [ ] **Step 4: Run → PASS. Commit.**

### Task E2: Field grid + sidebar components (+ test)

- [ ] **Step 1: Failing `IngredientFields.test.tsx`** — render with the board "Whole milk" fixture; assert all field labels present and inputs hold mapped values (unit "gallon", category "Dairy").
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** the components (each ≤200 lines) + `ingredient-form.module.css` with token vars. Sidebar cards render static board content (display-only).
- [ ] **Step 4: Create route `pantry.$itemId.tsx`** — composition only, loader fetches the item (`api.pantry.list` filter or a `pantry.byId` query — add `byId` to the router + an integration test if you prefer a dedicated query; otherwise filter loader data).
- [ ] **Step 5: Run tests + gates → PASS. Commit.**

```bash
git commit -m "feat(web): ingredient edit form (board §06)"
```

> If a `pantry.byId` procedure is added, add it in Slice C style with an integration test in the same commit.

---

# Slice F — Web: Account (frame 3, §06, display-only shell)

**Files:**
- Create route: `apps/web/src/routes/_authed/settings.tsx`
- Create: `apps/web/src/features/account/strings.ts`, `account.module.css`
- Create components: `AccountScreen.tsx`, `AccountSidebar.tsx`, `ProfileCard.tsx`, `PreferencesCard.tsx`, `StatsCard.tsx`
- Test: `apps/web/src/features/account/AccountScreen.test.tsx`

Board ref `web-screens-b.jsx:320-410`. Settings sidebar nav (Account selected; Pantry preferences, Diet & allergies, Notifications, Connections, Billing, Sign out). Profile card: avatar initials + name/email/joined from `api.user.me` (real), Display name/Email/Household/Time zone fields (static board values). Cooking preferences rows (static). Stats card (142 meals / $680 / 38 lbs — static board values). **All preference/stat/subscription rows are display-only** (settled decision). Subscription/Billing row stubbed.

### Task F1: strings + components + test

- [ ] **Step 1: Failing `AccountScreen.test.tsx`** — render with a `user` prop `{ name: 'Mara Singh', email: 'mara@home.kitchen' }`; assert name, email, "Account" heading, "Stats since you joined", and the three stat numbers render. Mock router as in M1 tests.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `strings.ts`** with all board copy + static preference/stat values, and the components (presentational, ≤200 lines each, token styles). Wire avatar/name/email to `user` prop; everything else from strings.
- [ ] **Step 4: Create route `settings.tsx`** — `loader: () => api.user.me.query()`, composition only.
- [ ] **Step 5: Run tests + gates → PASS. Commit.**

```bash
git commit -m "feat(web): account settings shell (board §06)"
```

---

# Slice G — Mobile: Pantry tap-to-cook (frame 4, §07)

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/pantry.tsx` (composition only)
- Create: `apps/mobile/src/features/pantry/strings.ts`, `useCookSelection.ts`, `usePantry.ts`
- Create components: `PantryScreen.tsx`, `PantrySection.tsx`, `PantryRow.tsx`, `CookTray.tsx`
- Test: `apps/mobile/src/features/pantry/useCookSelection.test.ts`

Board ref `mobile-screens-a.jsx:91-216`. Header eyebrow "Pantry" + search/filter icons; h1 "What's in?"; subtitle "tap anything to cook with it · 2 expiring soon". Two sections: "Needs using" (warning/danger via `freshnessFor`, sorted by `rankByExpiration`) and "Fresh". Row = 22×22 checkbox (accent bg when selected) + name + qty·category + status pill. Floating `CookTray` (dark inverse) appears when ≥1 selected: eyebrow "Cook with {n}", selected-item chips, **Cook button (no-op stub, decision-logged)**. Reuse native `Icon`, `Button`, `tokens`, `fonts`.

### Task G1: useCookSelection hook (+ test)

- [ ] **Step 1: Failing `useCookSelection.test.ts`** — assert `toggle(id)` adds/removes, `selectedIds`/`count` derive, `selectedItems` resolves against a provided item list, `clear()` empties.
- [ ] **Step 2: Run → FAIL.** `pnpm --filter @pantry/mobile test`
- [ ] **Step 3: Implement `useCookSelection.ts`** (Set-based selection state, ≤120 lines).
- [ ] **Step 4: Run → PASS. Commit.**

### Task G2: Pantry screen + tray

- [ ] **Step 1: Implement `usePantry.ts`** — `api.pantry.list.query()` + split into needs-using/fresh via `freshnessFor`, ranked by `rankByExpiration`.
- [ ] **Step 2: Implement `strings.ts`** (board copy) + components. `CookTray` renders chips + Cook button; `onCook` prop is a stub passed from the screen (`() => { /* M4 */ }`). Each component ≤200 lines, RN `StyleSheet` + `tokens`. Add `testID`s for Maestro (`pantry-row-{id}`, `cook-tray`, `cook-button`).
- [ ] **Step 3: Replace `app/(tabs)/pantry.tsx`** body with `<PantryScreen />` (composition only).
- [ ] **Step 4: Run gates → PASS. Commit.**

```bash
git commit -m "feat(mobile): pantry tap-to-cook screen (board §07)"
```

---

# Slice H — Mobile: Add/Edit ingredient + 3 picker sheets (frames 5–9, §09/§09.5)

**Files:**
- Create routes: `apps/mobile/src/app/(modals)/add-ingredient.tsx`, `apps/mobile/src/app/(modals)/edit-ingredient.tsx` (or `pantry/[id].tsx`) — match existing expo-router group conventions; if no `(modals)` group exists, add one with a `_layout.tsx` presenting modally.
- Create: `apps/mobile/src/features/ingredient/strings.ts`, `useIngredientForm.ts`
- Create components: `AddIngredientScreen.tsx`, `EditIngredientScreen.tsx`, `IngredientDetails.tsx`, `QuickActions.tsx`, `SuggestionPills.tsx`
- Create picker sheets: `CategorySheet.tsx`, `LocationSheet.tsx`, `BestBySheet.tsx` (in `features/ingredient/sheets/`)
- Test: `apps/mobile/src/features/ingredient/useIngredientForm.test.ts`, `apps/mobile/src/features/ingredient/sheets/CategorySheet.test.tsx`

Board refs: add `mobile-screens-b.jsx:548-676`, edit `:417-546`, sheets `bottom-sheet.jsx:126-255`. All three pickers ride the **canonical `BottomSheet` + `SheetRow`** from `@pantry/design-system/native` (already exist). Category sheet: 7 rows (icon circle, label, sub-label, radio), footer "Cancel"/"Use Dairy". Location: 7 rows, footer "+ Add a place"/"Use Top shelf". Best-by: quick-pick pills (3 days/1 week/2 weeks/1 month/3 months/6 months/1 year/Never) + month calendar grid + smart-hint card, footer "Don't track"/"Save · {date}".

### Task H1: Picker sheets (+ test)

- [ ] **Step 1: Failing `CategorySheet.test.tsx`** — render with `value='dairy'`; assert 7 category labels + sublabels present, the selected row marked, `onSelect('produce')` fires on press, footer "Use Dairy" reflects current value.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `CategorySheet`, `LocationSheet`, `BestBySheet`** using `BottomSheet`/`SheetRow`. Option lists derive from `PANTRY_CATEGORIES`/`PANTRY_LOCATIONS` + label maps (define mobile label maps in `features/ingredient/strings.ts` — single home, no dup). BestBy quick-pick values from a `BEST_BY_PRESETS` const. Calendar: build a month grid helper in `@pantry/utils` (`monthGrid(year, month)`) **with its own unit test** if non-trivial — reuse, don't inline.
- [ ] **Step 4: Run → PASS. Commit.**

### Task H2: Add/Edit forms + form hook (+ test)

- [ ] **Step 1: Failing `useIngredientForm.test.ts`** — assert field state, sheet open/close state for the 3 pickers, `save()` calls `api.pantry.create` (add) / `api.pantry.update` (edit) with mapped values.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** `strings.ts` (board copy: "Add to pantry", "What is it", "e.g. heavy cream", quick actions Scan/Receipt/Speak, "Add to pantry"/"Add and another", edit: "Edit item", "Remove from pantry", "Freshness", "Use it in"), `useIngredientForm.ts` (form + picker state machine in the hook), and the screen components. "Use it in" rows + auto-detected pill are static/display-only this milestone. Add `testID`s for Maestro.
- [ ] **Step 4: Wire routes** (modal presentation) and a Pantry/Inventory "Add ingredient" entry point.
- [ ] **Step 5: Run gates → PASS. Commit.**

```bash
git commit -m "feat(mobile): add/edit ingredient + category/location/best-by sheets (board §09/§09.5)"
```

---

# Slice I — Mobile: Account shell (frame 10, §10)

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/me.tsx` (composition only)
- Create: `apps/mobile/src/features/account/strings.ts`, components `AccountScreen.tsx`, `AccountStatsCard.tsx`, `SettingsSection.tsx`, `SettingsRow.tsx`
- Test: `apps/mobile/src/features/account/AccountScreen.test.tsx`

Board ref `mobile-screens-a.jsx:218-304`. Header eyebrow "Me" + profile row (avatar "MS", name/email from `api.user.me`, chevron). Stats card (eyebrow "Since March", 142/$680/38 lbs — static). Three sections: Cooking (Default weirdness/Diet/Allergies/Skill), Household (Size/Kitchen), App (Notifications/Connected services/Appearance) — all static rows. Footer "Sign out" (reuse M1 sign-out) + version "v1.4.0 · build 214". Display-only except sign-out + real name/email.

### Task I1: strings + components + test

- [ ] **Step 1: Failing `AccountScreen.test.tsx`** — render with `user` prop; assert name/email, "Since March", three stat numbers, and section labels render.
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** strings (all board copy) + components (presentational, token styles). Sign-out reuses the existing mobile auth-client sign-out + `useAuthGate` redirect.
- [ ] **Step 4: Replace `me.tsx`** body with `<AccountScreen />` (composition only; load `api.user.me`).
- [ ] **Step 5: Run gates → PASS. Commit.**

```bash
git commit -m "feat(mobile): account shell (board §10)"
```

---

# Slice J — Screenshot fidelity gate + e2e + decisions log

**Files:**
- Create: `docs/checklists/m2-pantry.md`
- Modify: `docs/decisions.md` (M2 entries)
- Reference captures: `tools/design-fidelity/references/*` (committed)
- App captures: `tools/design-fidelity/output/app/*`
- Create: `e2e/web/specs/pantry.spec.ts`
- Create: `e2e/mobile/pantry.yaml`
- Modify: roadmap Status table

### Task J1: Capture reference frames for M2

- [ ] **Step 1: Capture references** for the 10 M2 frames from the board.

Run: `pnpm -C tools/design-fidelity capture:references`
Expected: new `references/*.png` for §05–§10 frames + manifest updated. Verify the 10 expected slugs exist.

- [ ] **Step 2: Commit references**

```bash
git add tools/design-fidelity/references
git commit -m "test(fidelity): capture M2 board reference frames"
```

### Task J2: Capture + compare web frames

- [ ] **Step 1: Boot stack + dev servers** (api :4000, web :3000) with seeded mock pantry data matching the board (a fixture user with the board's 12 items). Add a fidelity fixture seed if the capture script needs deterministic data — mirror the M1 `capture-app-web.ts` field-population approach.
- [ ] **Step 2: Capture web app frames** for Inventory, Ingredient form, Account.

Run: `pnpm -C tools/design-fidelity capture:web`

- [ ] **Step 3: Compare each** against its reference → `report.html`.

Run: `pnpm -C tools/design-fidelity compare references/<slug>.png output/app/<slug>.png` (per frame)

- [ ] **Step 4: Iterate UI** until the report is faithful (layout/spacing/type/color), then record approval rows in `docs/checklists/m2-pantry.md` (frame, reference file, approval date, pixelmatch %).

### Task J3: Capture mobile frames

- [ ] **Step 1: Capture** the 7 mobile frames via `xcrun simctl io screenshot` on the pinned device (status-bar override + frozen clock per M1 method), driving the app to each state (pantry with 2 selected, add, edit, each of the 3 sheets open, account).
- [ ] **Step 2: Compare + approve** in `docs/checklists/m2-pantry.md` (human gate; pixelmatch tripwire where sizes match).

### Task J4: Web e2e add → edit → delete

- [ ] **Step 1: Write `e2e/web/specs/pantry.spec.ts`** — sign up (reuse the M1 `gotoHydrated` + unique-email helpers), navigate to `/pantry`, click "Add ingredient", fill the form, save, assert the item appears in the table; open it, edit the name, save, assert updated; delete, assert removed.

```ts
test('add → edit → delete a pantry item', async ({ page }) => {
  // sign up + land authed (reuse helpers from auth.spec.ts)
  await page.getByRole('button', { name: 'Add ingredient' }).click();
  await page.getByLabel('Name').fill('Whole milk');
  // ... quantity/unit/category/location
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Whole milk')).toBeVisible();
  // edit
  await page.getByText('Whole milk').click();
  await page.getByLabel('Name').fill('Skim milk');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Skim milk')).toBeVisible();
  // delete
  await page.getByText('Skim milk').click();
  await page.getByRole('button', { name: 'Remove from pantry' }).click();
  await expect(page.getByText('Skim milk')).toHaveCount(0);
});
```

- [ ] **Step 2: Run e2e → PASS.**

Run: `pnpm --filter @pantry/e2e-web e2e`
Expected: pantry spec green (and the M1 auth spec still green).

- [ ] **Step 3: Commit**

```bash
git add e2e/web/specs/pantry.spec.ts
git commit -m "test(e2e): web pantry add/edit/delete flow"
```

### Task J5: Maestro mobile pantry flow

- [ ] **Step 1: Write `e2e/mobile/pantry.yaml`** — launch, sign in, tap Pantry tab, assert "What's in?", tap a pantry row to select, assert the cook tray ("Cook with 1") appears. (Stays local/Expo-Go-verified per M1 status; CI execution deferred.)
- [ ] **Step 2: Verify locally** against Expo Go; note result in `docs/checklists/m2-pantry.md`.
- [ ] **Step 3: Commit.**

### Task J6: Decisions log + roadmap status

- [ ] **Step 1: Append to `docs/decisions.md`** (newest first): (a) Account screens display-only shells in M2; (b) tap-to-cook Cook button stubbed until M4; (c) inventory event log kinds + the delete-cascade nuance; (d) any board-silent composition calls (e.g., inventory empty state, error states) made from existing primitives.
- [ ] **Step 2: Update roadmap Status table** — mark M2 **done**, link this plan and `docs/checklists/m2-pantry.md`.
- [ ] **Step 3: Final full gate sweep.**

Run: `podman compose -f infra/podman/compose.yaml up -d && pnpm lint && pnpm typecheck && pnpm test && pnpm -r build`
Expected: all green, 0 warnings, 0 TS errors.

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: M2 complete; decisions logged; roadmap status updated"
```

---

## Verification (end-to-end)

1. **Unit/contract:** `pnpm test` — contracts enum/DTO tests, utils expiration + month-grid tests, API pantry integration tests (create/list/update/delete/ownership), web component + hook tests, mobile hook + sheet tests all green.
2. **Types & lint:** `pnpm typecheck` (0 errors, all 9+ workspaces) and `pnpm lint` (`--max-warnings 0`, no `eslint-disable`/`any`). This is the "clean up TS errors" gate — must stay at zero.
3. **Build:** `pnpm -r build` succeeds.
4. **DB:** `pnpm --filter @pantry/api db:migrate` applies `0001_*` cleanly on a fresh DB.
5. **Fidelity:** all 10 frames approved in `docs/checklists/m2-pantry.md` (3 web via pixelmatch report, 7 mobile via simulator capture + human gate).
6. **E2E:** `pnpm --filter @pantry/e2e-web e2e` green (web add→edit→delete + M1 auth); Maestro `pantry.yaml` verified locally.
7. **Manual smoke:** `podman compose up`, sign in on web → add an item via the form → see it ranked by expiration in Inventory → edit → delete; on mobile → tap pantry rows → cook tray appears with chips.

## Self-review notes

- **Spec coverage:** every M2 bullet mapped — contracts+enums (A), inventory event log (A4/B/C), expiration ranking in `packages/utils` unit-tested (A5), web Inventory/Ingredient form/Account (D/E/F), mobile Pantry tap-to-cook + Add/Edit + 3 picker sheets on canonical BottomSheet + Account shell (G/H/I), ~11 (=10) frames matched + CRUD integration tests + web e2e add/edit/delete (C/J). Recipe-detail correctly excluded (M5).
- **Type consistency:** enum value sets defined once in `@pantry/contracts` and imported by DB enums, router, and UI label maps; `numeric`↔`number` mapping isolated in `toDto`; `freshnessFor`/`rankByExpiration` signatures consistent across web + mobile consumers.
- **No new suppressions:** plan adds zero `eslint-disable`/`any`/`@ts-expect-error`; all files target ≤200 lines, routes composition-only.
