# M8 — Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subscriptions, usage limits, and top-up credits to Pantry CoPilot v3 — RevenueCat-backed entitlement state, server-enforced quotas on AI actions, and the board's §11–§15 paywall / trial / settings screens on web and mobile.

**Architecture:** RevenueCat is the canonical billing event stream. The API owns a server-authoritative entitlement mirror (`user_subscriptions`) populated by **idempotent, auth-checked webhooks** plus an on-demand REST pull; the client `customerInfo` is never trusted for gating. AI actions (recipe generation, image scan) pass through an `assertAiActionAllowed` quota gate that throws a typed `limit_reached` error the clients turn into a paywall. Mobile purchases via `react-native-purchases`; web via **RevenueCat Web Billing**. UI screens compose strictly from existing design-system primitives and match the board.

**Tech Stack:** Fastify + tRPC + Drizzle + PostgreSQL (API), TanStack Start + CSS Modules (web), Expo + expo-router + react-native-purchases (mobile), Zod contracts, Vitest + Playwright + Maestro. RevenueCat (REST v1 + webhooks + Web Billing SDK + react-native-purchases).

**Board frames (the spec, all in `pantry-copilot-v2/claudeDesignOutput/`):**

| # | Frame | Board source |
| - | ----- | ------------ |
| 1 | Web · Paywall (onboarding / editorial) | `screens/paywall-a.jsx` → `WebPaywallA` |
| 2 | Mobile · Paywall A | `screens/paywall-a.jsx` → `MobilePaywallA` |
| 3 | Web · Paywall (plan compare / ledger) | `screens/paywall-b.jsx` → `WebPaywallB` |
| 4 | Mobile · Paywall B | `screens/paywall-b.jsx` → `MobilePaywallB` |
| 5 | Web · Limit-hit modal | `screens/paywall-contextual.jsx` → `WebLimitHit` |
| 6 | Mobile · Limit-hit sheet | `screens/paywall-contextual.jsx` → `MobileLimitHit` |
| 7 | Mobile · Pre-trial offer | `screens/paywall-b.jsx`/board §13 → `MobileTrialOffer` |
| 8 | Mobile · Trial-ending | `screens/paywall-contextual.jsx` → `MobileTrialEnding` |
| 9 | Web · Trial-ending page | `screens/paywall-contextual.jsx` → `WebTrialEnding` |
| 10 | Web · Settings → Subscription (Pro active) | `screens/subscription.jsx` |
| 11 | Mobile · Settings (Free) | `screens/subscription.jsx` → `MobileSettingsWithSub state="free"` |
| 12 | Mobile · Settings (Trial) | `screens/subscription.jsx` → `MobileSettingsWithSub state="trial"` |
| 13 | Mobile · Settings (Pro) + Manage subscription | `screens/subscription.jsx` → `MobileSettingsWithSub state="pro"`, `MobileManageSubscription` |

(Read each board source file completely before building its screen. Capture reference frames via `tools/design-fidelity` exactly as M4–M7 did.)

**Key v2 reference files (consult, never copy — all under `pantry-copilot-v2/`):**
- `services/api/src/modules/subscription/service.ts` — entitlement derivation, ledger, upsert
- `services/api/src/modules/subscription/limits.ts` — quota state + `assertAiActionAllowed`
- `services/api/src/modules/subscription/webhook.ts` — idempotent webhook ingestion
- `services/api/src/modules/subscription/router.ts` — `get` / `usage` / `syncFromRevenueCat`
- `services/api/src/db/schema.ts` — `userSubscriptions`, `revenuecatWebhookEvents`, `topUpCreditGrants`, `topUpCreditConsumptions`
- `docs/revenuecat-e2e-testing.md` — sandbox/webhook testing playbook

---

## Open decisions — confirm with the user before Slice C

These are product/billing calls the board and roadmap don't fully pin down. Recommended defaults are written into the tasks below; if the user disagrees, adjust the named task before implementing.

1. **Quota window for the free tier.** The board copy says **weekly** ("Weekly limit reached · 3 of 3 · resets Sunday"); v2 enforced **monthly**. **Recommendation: weekly** (board-faithful), reset Sunday 00:00 UTC, count configurable via env. This plan implements weekly. *(If monthly is chosen, only `startOfPeriod` + env names change.)*
2. **Tier model.** The board shows three plans (Free, **Basic** $4.99/mo, **Pro** $9.99/mo). v2 modeled a binary `isPro`. **Recommendation: a `tier` enum (`'free' | 'basic' | 'pro'`)** derived from which RevenueCat entitlement is active, with per-tier limits; `isPro` retained as a derived convenience (`tier !== 'free'` is NOT the same as Pro — see limits table). This plan implements the `tier` enum.
3. **Web billing provider.** Roadmap says **RevenueCat Web Billing**. This plan integrates the RevenueCat Web Billing JS SDK; if a key isn't provisioned yet, the purchase button is wired behind a `REVENUECAT_WEB_BILLING_KEY` env guard and the e2e uses the mock/sandbox path.

---

## Engineering standards (enforced — see roadmap "Engineering standards")

- TDD: failing test first, every slice. **A web slice without web tests does not merge.** API integration tests run against ephemeral postgres (`podman compose ... up -d` first).
- No `any`, no `eslint-disable`, `--max-warnings 0`. Components ≤300 lines (target 200); route files composition-only. State machines in hooks/reducers.
- All user-facing strings in per-feature `strings.ts`. No inline JSX literals (`react/jsx-no-literals`).
- Pin exact dependency versions (`save-exact=true`). New deps (`react-native-purchases`, `@revenuecat/purchases-js`) are added at this milestone boundary.
- Run `pnpm lint && pnpm typecheck && pnpm test` before any commit that claims completion. Commit frequently (one logical change per commit).

---

## Slice A — Contracts (`packages/contracts`)

**Goal:** Zod schemas + types shared by API and both clients: entitlement state, quota/usage state, plan catalog, and the `limit_reached` error discriminator.

**Files:**
- Create: `packages/contracts/src/subscription/enums.ts`
- Create: `packages/contracts/src/subscription/state.ts`
- Create: `packages/contracts/src/subscription/state.test.ts`
- Create: `packages/contracts/src/subscription/plans.ts`
- Create: `packages/contracts/src/subscription/plans.test.ts`
- Modify: `packages/contracts/src/index.ts` (re-export the new module)

- [ ] **Step 1: Write the failing test for the subscription state schema**

`packages/contracts/src/subscription/state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SubState, SubscriptionState, UsageState, UserUsage } from './state.js';

describe('SubState', () => {
  it('accepts every lifecycle value', () => {
    for (const v of ['none', 'active', 'cancelled', 'expired', 'in_grace_period', 'in_billing_retry', 'paused', 'refunded'])
      expect(SubState.parse(v)).toBe(v);
  });
  it('rejects unknown values', () => {
    expect(() => SubState.parse('lapsed')).toThrow();
  });
});

describe('SubscriptionState', () => {
  it('parses a free default row', () => {
    const parsed = SubscriptionState.parse({
      tier: 'free', isPro: false, subState: 'none', expiresAt: null, willRenew: false,
      productIdentifier: null, periodType: null, store: null, topUpCredits: 0, inGracePeriod: false,
    });
    expect(parsed.tier).toBe('free');
  });
});

describe('UsageState / UserUsage', () => {
  it('parses a per-kind usage view', () => {
    const u: UsageState = { kind: 'recipe', tier: 'free', used: 3, tierLimit: 3, topUpBonus: 0, totalLimit: 3, remaining: 0, allowed: false };
    expect(UsageState.parse(u).remaining).toBe(0);
    expect(UserUsage.parse({ recipes: u, scans: { ...u, kind: 'scan' } }).recipes.kind).toBe('recipe');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter @pantry/contracts test src/subscription/state.test.ts`
Expected: FAIL — module `./state.js` not found.

- [ ] **Step 3: Implement enums**

`packages/contracts/src/subscription/enums.ts`:

```ts
export const SUBSCRIPTION_TIERS = ['free', 'basic', 'pro'] as const;
export const SUB_STATES = [
  'none', 'active', 'cancelled', 'expired',
  'in_grace_period', 'in_billing_retry', 'paused', 'refunded',
] as const;
export const AI_ACTION_KINDS = ['recipe', 'scan'] as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];
export type SubStateValue = (typeof SUB_STATES)[number];
export type AiActionKind = (typeof AI_ACTION_KINDS)[number];
```

- [ ] **Step 4: Implement state schemas**

`packages/contracts/src/subscription/state.ts`:

```ts
import { z } from 'zod';
import { AI_ACTION_KINDS, SUB_STATES, SUBSCRIPTION_TIERS } from './enums.js';

export const SubscriptionTierSchema = z.enum(SUBSCRIPTION_TIERS);
export const SubState = z.enum(SUB_STATES);

/** Server-authoritative entitlement mirror, exposed to clients. */
export const SubscriptionState = z.object({
  tier: SubscriptionTierSchema,
  /** Convenience flag: the user has any paid, active entitlement. */
  isPro: z.boolean(),
  subState: SubState,
  expiresAt: z.string().datetime().nullable(),
  willRenew: z.boolean(),
  productIdentifier: z.string().nullable(),
  periodType: z.string().nullable(),
  store: z.string().nullable(),
  topUpCredits: z.number().int().nonnegative(),
  inGracePeriod: z.boolean(),
});
export type SubscriptionState = z.infer<typeof SubscriptionState>;
export type SubStateValue = z.infer<typeof SubState>;

export const UsageState = z.object({
  kind: z.enum(AI_ACTION_KINDS),
  tier: SubscriptionTierSchema,
  used: z.number().int().nonnegative(),
  tierLimit: z.number().int().nonnegative(),
  topUpBonus: z.number().int().nonnegative(),
  totalLimit: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  allowed: z.boolean(),
});
export type UsageState = z.infer<typeof UsageState>;

export const UserUsage = z.object({ recipes: UsageState, scans: UsageState });
export type UserUsage = z.infer<typeof UserUsage>;
```

> Note: v2 stored `expiresAt` as a `Date` in the router output. We serialize through superjson, but for cross-platform safety the **DTO** uses ISO strings; the API maps `Date → toISOString()` at the boundary (mirrors how `recipes.ts` maps `createdAt`).

- [ ] **Step 5: Run the state test — expect PASS**

Run: `pnpm --filter @pantry/contracts test src/subscription/state.test.ts`
Expected: PASS.

- [ ] **Step 6: Write the failing plan-catalog test**

`packages/contracts/src/subscription/plans.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PLAN_CATALOG, PlanId } from './plans.js';

describe('PLAN_CATALOG', () => {
  it('has basic and pro plans with monthly + annual prices', () => {
    expect(PlanId.parse('pro')).toBe('pro');
    const pro = PLAN_CATALOG.pro;
    expect(pro.priceMonthly).toBeGreaterThan(0);
    expect(pro.priceAnnual).toBeGreaterThan(0);
    expect(pro.features.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 7: Implement the plan catalog (board prices from `paywall-a.jsx`)**

`packages/contracts/src/subscription/plans.ts`:

```ts
import { z } from 'zod';

export const PlanId = z.enum(['basic', 'pro']);
export type PlanId = z.infer<typeof PlanId>;

export interface PlanDef {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  annualSavingsPct: number;
  /** RevenueCat package identifiers — set from dashboard config at integration time. */
  rcMonthlyPackage: string;
  rcAnnualPackage: string;
}

/** Catalog drives plan-card rendering; copy (features/blurbs) lives in feature strings. */
export const PLAN_CATALOG: Record<PlanId, PlanDef> = {
  basic: { id: 'basic', name: 'Basic', priceMonthly: 4.99, priceAnnual: 39, annualSavingsPct: 35, rcMonthlyPackage: '$rc_monthly_basic', rcAnnualPackage: '$rc_annual_basic' },
  pro: { id: 'pro', name: 'Pro', priceMonthly: 9.99, priceAnnual: 79, annualSavingsPct: 33, rcMonthlyPackage: '$rc_monthly', rcAnnualPackage: '$rc_annual' },
};
```

- [ ] **Step 8: Run the plans test — expect PASS**

Run: `pnpm --filter @pantry/contracts test src/subscription/plans.test.ts`
Expected: PASS.

- [ ] **Step 9: Re-export from the contracts barrel**

In `packages/contracts/src/index.ts`, add (alongside the existing exports):

```ts
export * from './subscription/enums.js';
export * from './subscription/state.js';
export * from './subscription/plans.js';
```

- [ ] **Step 10: Full contracts gate + commit**

Run: `pnpm --filter @pantry/contracts test && pnpm --filter @pantry/contracts typecheck`
Expected: all PASS.

```bash
git add packages/contracts/src/subscription packages/contracts/src/index.ts
git commit -m "feat(contracts): subscription state, usage, and plan-catalog schemas (M8)"
```

---

## Slice B — DB schema + migration (`services/api`)

**Goal:** Four tables mirroring v2: the entitlement row, the webhook idempotency log, and the append-only top-up credit ledger.

**Files:**
- Create: `services/api/src/db/schema/subscriptions.ts`
- Modify: `services/api/src/db/schema/index.ts`
- Generate: `services/api/drizzle/0008_*.sql` (via `db:generate`)
- Test: `services/api/src/db/schema/subscriptions.test.ts`

- [ ] **Step 1: Write the failing schema-shape test**

`services/api/src/db/schema/subscriptions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { topUpCreditConsumptions, topUpCreditGrants, revenuecatWebhookEvents, userSubscriptions } from './subscriptions.js';

describe('subscription schema', () => {
  it('exposes the four tables with their key columns', () => {
    expect(userSubscriptions.userId).toBeDefined();
    expect(userSubscriptions.tier).toBeDefined();
    expect(userSubscriptions.topUpCredits).toBeDefined();
    expect(revenuecatWebhookEvents.eventId).toBeDefined();
    expect(topUpCreditGrants.sourceEventId).toBeDefined();
    expect(topUpCreditConsumptions.actionKind).toBeDefined();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (`./subscriptions.js` missing).

Run: `pnpm --filter @pantry/api test src/db/schema/subscriptions.test.ts`

- [ ] **Step 3: Implement the schema** (port v2 shape; `tier` enum added per decision #2)

`services/api/src/db/schema/subscriptions.ts`:

```ts
import { SUB_STATES, SUBSCRIPTION_TIERS } from '@pantry/contracts';
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.js';

export const subscriptionTier = pgEnum('subscription_tier', SUBSCRIPTION_TIERS);
export const subState = pgEnum('sub_state', SUB_STATES);

/** Server-authoritative entitlement mirror. Canonical source = RC webhooks. */
export const userSubscriptions = pgTable('user_subscriptions', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  rcAppUserId: text('rc_app_user_id').notNull(),
  tier: subscriptionTier('tier').notNull().default('free'),
  isPro: boolean('is_pro').notNull().default(false),
  productIdentifier: text('product_identifier'),
  periodType: text('period_type'),
  expiresAt: timestamp('expires_at'),
  willRenew: boolean('will_renew').notNull().default(false),
  store: text('store'),
  /** Cached balance = sum(grants) − sum(consumptions); ledger is the source of truth. */
  topUpCredits: integer('top_up_credits').notNull().default(0),
  subState: subState('sub_state').notNull().default('none'),
  inGracePeriod: boolean('in_grace_period').notNull().default(false),
  raw: jsonb('raw').$type<Record<string, unknown>>(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

/** RC retries webhooks up to 3× and may double-deliver — dedupe on event.id. */
export const revenuecatWebhookEvents = pgTable('revenuecat_webhook_events', {
  eventId: text('event_id').primaryKey(),
  type: text('type').notNull(),
  appUserId: text('app_user_id').notNull(),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
});

export const topUpCreditGrants = pgTable('top_up_credit_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  /** RC `event.id` of the NON_RENEWING_PURCHASE that produced this grant. */
  sourceEventId: text('source_event_id').notNull(),
  amount: integer('amount').notNull(),
  productIdentifier: text('product_identifier'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  userIdx: index('top_up_credit_grants_user_idx').on(t.userId),
  eventIdUq: uniqueIndex('top_up_credit_grants_source_event_idx').on(t.sourceEventId),
}));

export const topUpCreditConsumptions = pgTable('top_up_credit_consumptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actionKind: text('action_kind').notNull(),
  amount: integer('amount').notNull().default(1),
  sourceTable: text('source_table'),
  sourceId: text('source_id'),
  consumedAt: timestamp('consumed_at').notNull().defaultNow(),
}, (t) => ({
  userIdx: index('top_up_credit_consumptions_user_idx').on(t.userId, t.consumedAt),
}));
```

- [ ] **Step 4: Export from the schema barrel**

In `services/api/src/db/schema/index.ts` add: `export * from './subscriptions.js';`

- [ ] **Step 5: Run the schema test — expect PASS.**

- [ ] **Step 6: Generate the migration**

Run: `pnpm --filter @pantry/api db:generate`
Expected: a new file `services/api/drizzle/0008_*.sql` creating the two enums + four tables. Open it and verify the `CREATE TYPE subscription_tier`, `CREATE TABLE user_subscriptions`, unique index on `source_event_id`, etc. Do **not** hand-edit beyond confirming.

- [ ] **Step 7: Apply + commit**

Run (postgres must be up): `pnpm --filter @pantry/api db:migrate`
Expected: migration applies cleanly.

```bash
git add services/api/src/db/schema/subscriptions.ts services/api/src/db/schema/index.ts services/api/drizzle/0008_*.sql services/api/drizzle/meta
git commit -m "feat(api): subscription, webhook-log, and top-up ledger tables + migration 0008 (M8)"
```

---

## Slice C — Subscription service + limits (`services/api`)

**Goal:** Port v2's entitlement derivation, credit ledger, and quota gate. Pure-ish functions over `db`, fully unit/integration tested.

**Files:**
- Create: `services/api/src/modules/subscription/service.ts`
- Create: `services/api/src/modules/subscription/limits.ts`
- Test: `services/api/src/modules/subscription/service.test.ts` (unit — `deriveStateFromSubscriber` is pure)
- Test: `services/api/src/modules/subscription/limits.integration.test.ts` (ephemeral postgres)
- Modify: `services/api/src/env.ts` (add limit + RC env — see Step 1)

- [ ] **Step 1: Add env vars** (failing typecheck until used)

In `services/api/src/env.ts`, extend the schema object with:

```ts
    // ── Subscription limits (per-period; free = weekly per board) ──
    AI_FREE_RECIPES_PER_WEEK: z.coerce.number().int().nonnegative().default(3),
    AI_FREE_SCANS_PER_WEEK: z.coerce.number().int().nonnegative().default(2),
    AI_BASIC_RECIPES_PER_WEEK: z.coerce.number().int().nonnegative().default(10),
    AI_BASIC_SCANS_PER_WEEK: z.coerce.number().int().nonnegative().default(5),
    /** Pro is effectively unlimited — a high ceiling, not Infinity, so counters stay finite. */
    AI_PRO_RECIPES_PER_WEEK: z.coerce.number().int().nonnegative().default(100000),
    AI_PRO_SCANS_PER_WEEK: z.coerce.number().int().nonnegative().default(100000),
    AI_TOP_UP_CREDIT_VALUE: z.coerce.number().int().positive().default(10),
    // ── RevenueCat ──
    REVENUECAT_SECRET_API_KEY: z.string().optional(),
    REVENUECAT_API_BASE: z.url().default('https://api.revenuecat.com'),
    REVENUECAT_PRO_ENTITLEMENT_ID: z.string().default('pro'),
    REVENUECAT_BASIC_ENTITLEMENT_ID: z.string().default('basic'),
    /** Shared secret RC sends in the webhook Authorization header. */
    REVENUECAT_WEBHOOK_AUTH: z.string().optional(),
```

- [ ] **Step 2: Write the failing unit test for `deriveStateFromSubscriber`**

`services/api/src/modules/subscription/service.test.ts` — adapt v2's reasoning: a payload with an active `pro` entitlement → `tier: 'pro', isPro: true, subState: 'active'`; no entitlement → `tier: 'free'`; an expired entitlement past grace → `expired`; a `basic` entitlement → `tier: 'basic'`. Use `readEnv` test override so entitlement ids are deterministic.

```ts
import { describe, expect, it } from 'vitest';
import { deriveStateFromSubscriber } from './service.js';
import { readEnv } from '../../env.js';

const env = readEnv({ DATABASE_URL: 'postgres://x', BETTER_AUTH_SECRET: 'x'.repeat(32), REVENUECAT_PRO_ENTITLEMENT_ID: 'pro', REVENUECAT_BASIC_ENTITLEMENT_ID: 'basic' });
const now = new Date('2026-06-17T00:00:00Z');

it('derives pro/active from a live pro entitlement', () => {
  const s = deriveStateFromSubscriber({ subscriber: {
    entitlements: { pro: { expires_date: '2026-07-17T00:00:00Z', product_identifier: 'pro_monthly', purchase_date: '2026-06-17T00:00:00Z' } },
    subscriptions: { pro_monthly: { expires_date: '2026-07-17T00:00:00Z', period_type: 'normal', store: 'app_store' } },
  } }, env, now);
  expect(s.tier).toBe('pro');
  expect(s.isPro).toBe(true);
  expect(s.subState).toBe('active');
});

it('derives free when there is no entitlement', () => {
  const s = deriveStateFromSubscriber({ subscriber: {} }, env, now);
  expect(s.tier).toBe('free');
  expect(s.isPro).toBe(false);
  expect(s.subState).toBe('none');
});

it('derives basic tier from the basic entitlement', () => {
  const s = deriveStateFromSubscriber({ subscriber: {
    entitlements: { basic: { expires_date: '2026-07-17T00:00:00Z', product_identifier: 'basic_monthly', purchase_date: '2026-06-17T00:00:00Z' } },
    subscriptions: { basic_monthly: { expires_date: '2026-07-17T00:00:00Z', period_type: 'normal' } },
  } }, env, now);
  expect(s.tier).toBe('basic');
  expect(s.isPro).toBe(true);
});
```

- [ ] **Step 3: Run it — expect FAIL** (module missing).

- [ ] **Step 4: Implement `service.ts`** — port v2 `service.ts` with the `tier` extension. Key changes vs v2:
  - `deriveStateFromSubscriber(payload, env, now)` takes `env` (no module-level `env` import) so it stays unit-testable; checks the **pro** entitlement first, then **basic**, to set `tier`. `isPro = tier !== 'free'`.
  - `RcSubscriberResponse` interface copied verbatim from v2 (lines 17–48).
  - `computeTopUpBalance`, `grantTopUpCredit`, `consumeTopUpCredit`, `refreshTopUpCache` copied verbatim (they only touch the ledger tables).
  - `upsertSubscriptionFromSubscriber` and `readSubscription` updated to read/write `tier` and to return `expiresAt` as a `Date` internally (the router maps to ISO).
  - `fetchRevenueCatSubscriber(appUserId, env)` copied, taking `env` as an arg.

Write the full file modeled on the v2 reference (read it completely first). Pseudocode for the tier branch in `deriveStateFromSubscriber`:

```ts
const proEnt = sub.entitlements?.[env.REVENUECAT_PRO_ENTITLEMENT_ID];
const basicEnt = sub.entitlements?.[env.REVENUECAT_BASIC_ENTITLEMENT_ID];
const entitlement = proEnt ?? basicEnt;
const tier: SubscriptionTier = proEnt ? 'pro' : basicEnt ? 'basic' : 'free';
if (!entitlement) return { tier: 'free', isPro: false, /* …nulls… */ subState: 'none', inGracePeriod: false };
// …existing v2 expiry/grace/subState logic, with isPro = tier !== 'free' && (isLifetime || !expired || inGracePeriod)…
```

- [ ] **Step 5: Run the unit test — expect PASS.**

- [ ] **Step 6: Write the failing limits integration test**

`services/api/src/modules/subscription/limits.integration.test.ts` — use the repo's existing ephemeral-postgres harness (copy the setup from an existing `*.integration.test.ts` in `services/api`, e.g. the pantry/recipes integration test). Assert:
  - free user, 0 used → `getAiQuotaState(db,u,'recipe')` ⇒ `{ tier:'free', tierLimit:3, remaining:3, allowed:true }`.
  - after inserting 3 `recipes` rows with `source:'ai'` this week → `allowed:false, remaining:0`.
  - a recipe row dated **last week** does NOT count (weekly window).
  - `assertAiActionAllowed` throws `TRPCError` `FORBIDDEN` with `cause:'limit_reached'` when over.
  - with `topUpCredits>0` and tier exhausted, `assertAiActionAllowed` succeeds and **records a consumption** (balance decremented).

- [ ] **Step 7: Implement `limits.ts`** — port v2 `limits.ts` with two changes:
  - `startOfPeriod(now)` returns **start of current week (Sunday 00:00 UTC)** instead of month (per decision #1):

```ts
function startOfWeek(now: Date = new Date()): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // back to Sunday
  return d;
}
```
  - `tierLimit` resolves from the `tier` enum (free/basic/pro) using the new env keys, not a binary isPro. `getAiQuotaState` returns `tier` in its result (matches `UsageState`).
  - `countWeeklyAiUsage` mirrors v2's `countMonthlyAiUsage` but using `startOfWeek`; recipes counted only where `source:'ai'`.
  - `assertAiActionAllowed` unchanged in spirit: throws `limit_reached`, burns a top-up credit when over the tier limit but within `totalLimit`.

  > `recipes.source` must exist. Verify in `services/api/src/db/schema/recipes.ts`; if there is no `source` column yet, add one (`text('source').notNull().default('ai')`) in this slice with its own migration **0009**, since the quota logic depends on distinguishing AI from manual/imported recipes. (M2 manual recipes, if any, must set `source:'manual'`.)

- [ ] **Step 8: Run the integration test — expect PASS** (postgres up).

Run: `pnpm --filter @pantry/api test src/modules/subscription`

- [ ] **Step 9: Commit**

```bash
git add services/api/src/modules/subscription/service.ts services/api/src/modules/subscription/limits.ts services/api/src/modules/subscription/*.test.ts services/api/src/env.ts services/api/src/db/schema/recipes.ts services/api/drizzle
git commit -m "feat(api): entitlement derivation, top-up ledger, weekly quota gate (M8)"
```

---

## Slice D — Subscription router + entitlement enforcement (`services/api`)

**Goal:** Expose entitlement/usage to clients; gate the two paid AI actions.

**Files:**
- Create: `services/api/src/trpc/routers/subscription.ts`
- Modify: `services/api/src/trpc/router.ts` (mount `subscription`)
- Modify: `services/api/src/trpc/routers/recipes.ts` (gate `generateStream`)
- Modify: `services/api/src/trpc/routers/scan.ts` (gate `extract`)
- Test: `services/api/src/trpc/routers/subscription.integration.test.ts`
- Test: extend `recipes`/`scan` integration tests with a `limit_reached` case

- [ ] **Step 1: Write the failing router integration test** — call `subscription.get` (free defaults), `subscription.usage` (recipes+scans shape), and assert `recipes.generateStream` throws `limit_reached` once the weekly free recipe count is exhausted. Reuse the ephemeral-postgres + caller harness from existing router integration tests.

- [ ] **Step 2: Run it — expect FAIL.**

- [ ] **Step 3: Implement the router** — port v2 `router.ts`:

```ts
import { z } from 'zod';
import { SubscriptionState, UsageState } from '@pantry/contracts';
import { protectedProcedure, router } from '../init.js';
import { fetchRevenueCatSubscriber, readSubscription, upsertSubscriptionFromSubscriber } from '../../modules/subscription/service.js';
import { getAiQuotaState } from '../../modules/subscription/limits.js';
import { env } from '../../env.js'; // however env is accessed in this codebase; see note

export const subscriptionRouter = router({
  get: protectedProcedure.output(SubscriptionState).query(async ({ ctx }) => toStateDto(await readSubscription(ctx.db, ctx.session.user.id))),
  usage: protectedProcedure.output(z.object({ recipes: UsageState, scans: UsageState })).query(async ({ ctx }) => {
    const id = ctx.session.user.id;
    const [recipes, scans] = await Promise.all([getAiQuotaState(ctx.db, id, 'recipe'), getAiQuotaState(ctx.db, id, 'scan')]);
    return { recipes, scans };
  }),
  syncFromRevenueCat: protectedProcedure.output(SubscriptionState).mutation(async ({ ctx }) => { /* v2 throttled REST pull → upsert → return state */ }),
});
```

  - `toStateDto` maps the service row's `Date` fields to ISO strings to satisfy `SubscriptionState`.
  - **Env access:** the API uses dependency-injected env in `server.ts`/context, not a module singleton. Add `env` to the tRPC `Context` (in `services/api/src/trpc/context.ts`, include `env: deps.env`) so the router and the gate can read limits/RC config from `ctx.env`. Update `createContextFactory` and `AppDeps` usage accordingly. *(This is the one structural addition this slice makes; do it first, in its own commit, with a one-line context test.)*

- [ ] **Step 4: Gate `recipes.generateStream`** — at the top of the subscription generator, before inserting the job:

```ts
await assertAiActionAllowed(ctx.db, userId, 'recipe', undefined, undefined);
```
  (Import `assertAiActionAllowed` from `../../modules/subscription/limits.js`; it reads limits from env via ctx — adjust signature to accept `ctx.env`.) A thrown `limit_reached` aborts before any job/stream starts, so the client gets the typed error and shows the paywall.

- [ ] **Step 5: Gate `scan.extract`** — first line of the mutation body:

```ts
await assertAiActionAllowed(ctx.db, ctx.session.user.id, 'scan');
```

- [ ] **Step 6: Mount the router** — in `services/api/src/trpc/router.ts`:

```ts
import { subscriptionRouter } from './routers/subscription.js';
export const appRouter = router({ user: userRouter, pantry: pantryRouter, scan: scanRouter, recipes: recipesRouter, cook: cookRouter, subscription: subscriptionRouter });
```

- [ ] **Step 7: Run all api tests — expect PASS.** `pnpm --filter @pantry/api test`

- [ ] **Step 8: Commit**

```bash
git add services/api/src/trpc
git commit -m "feat(api): subscription router + entitlement gate on generation/scan (M8)"
```

---

## Slice E — RevenueCat webhook ingestion (`services/api`)

**Goal:** Idempotent, auth-checked `POST /webhooks/revenuecat` mounted outside tRPC; flips entitlement + grants top-ups.

**Files:**
- Create: `services/api/src/modules/subscription/webhook.ts`
- Modify: `services/api/src/server.ts` (register the route)
- Test: `services/api/src/modules/subscription/webhook.integration.test.ts`
- Fixtures: `services/api/src/modules/subscription/__fixtures__/*.json` (RC event payloads)

- [ ] **Step 1: Write the failing webhook integration test** — boot the server (or inject the route into a test Fastify), POST events with the shared-secret header. Assert:
  - missing/wrong `Authorization` → 401.
  - malformed body → 400.
  - `INITIAL_PURCHASE` for a known user → 200 and `user_subscriptions.tier` becomes `pro` (event-only mode, no secret key).
  - the **same `event.id` twice** → second response `{ duplicate: true }`, no double effect.
  - `NON_RENEWING_PURCHASE` → a `top_up_credit_grants` row appears once; replay is a no-op.
  - unknown event type → 200 `{ ignored: true }`.

- [ ] **Step 2: Run it — expect FAIL.**

- [ ] **Step 3: Implement `webhook.ts`** — port v2 `webhook.ts` near-verbatim, adjusting:
  - read config from the injected `env`/`deps` (the function takes `(app, deps)`), not a module singleton.
  - in event-only mode, set `tier` from event type (INITIAL_PURCHASE/RENEWAL/UNCANCELLATION/PRODUCT_CHANGE → infer `pro` vs `basic` from `product_id`; otherwise `free`), mirroring v2's `isPro` block but writing `tier`.
  - keep the `RcWebhookEventSchema`, `HANDLED_EVENT_TYPES`, idempotency insert on `revenuecat_webhook_events`, `resolveLocalUser`, `migrateAliasedData`, and the `NON_RENEWING_PURCHASE` grant path.

- [ ] **Step 4: Register the route** — in `services/api/src/server.ts`, after `registerAuthRoutes(...)` and before the tRPC plugin:

```ts
await registerRevenueCatWebhook(app, deps); // rateLimit:false on the route; raw JSON, no superjson framing
```

- [ ] **Step 5: Run the webhook test — expect PASS** (postgres up).

- [ ] **Step 6: Commit**

```bash
git add services/api/src/modules/subscription/webhook.ts services/api/src/modules/subscription/__fixtures__ services/api/src/modules/subscription/webhook.integration.test.ts services/api/src/server.ts
git commit -m "feat(api): idempotent RevenueCat webhook ingestion (M8)"
```

---

## Slice F — api-client surface (`packages/api-client`)

**Goal:** Ensure the new `subscription` procedures are reachable from web + mobile via the shared typed client (the client re-exports `AppRouter` types, so this is mostly a verification + any helper for the `limit_reached` error).

**Files:**
- Modify: `packages/api-client/src/index.ts` (export a `isLimitReachedError(err)` type guard)
- Test: `packages/api-client/src/index.test.ts`

- [ ] **Step 1: Write the failing test** for `isLimitReachedError` — given a TRPCClientError-shaped object with `data.cause === 'limit_reached'` (or message `'limit_reached'`), returns true; otherwise false.

- [ ] **Step 2: Run — FAIL. Step 3: Implement the guard. Step 4: Run — PASS.**

- [ ] **Step 5: Commit**

```bash
git add packages/api-client/src
git commit -m "feat(api-client): limit_reached error guard for paywall triggering (M8)"
```

---

## Slice G — Web monetization UI (`apps/web`)

**Goal:** Build the web board frames (1, 3, 5, 9, 10) + RevenueCat Web Billing purchase wiring. New feature dir `apps/web/src/features/billing/`.

> **Pattern (matches M2–M7):** `routes/x.tsx` (composition only) → `features/billing/components/*` → `features/billing/useBilling.ts` (purchase/restore state machine) → `features/billing/strings.ts` → `features/billing/billing.module.css`. Each component ≤300 lines. Read the board source file completely before each screen and match it; log any board-silent composition in `docs/decisions.md`.

**Files (create unless noted):**
- `apps/web/src/features/billing/strings.ts`
- `apps/web/src/features/billing/billing.module.css`
- `apps/web/src/features/billing/useBilling.ts` (+ `.test.ts`)
- `apps/web/src/features/billing/components/PlanCard.tsx` (+ `.test.tsx`)
- `apps/web/src/features/billing/components/BillingToggle.tsx`
- `apps/web/src/features/billing/components/PaywallEditorial.tsx` — board frame 1 (`WebPaywallA`)
- `apps/web/src/features/billing/components/PaywallCompare.tsx` — board frame 3 (`WebPaywallB`)
- `apps/web/src/features/billing/components/LimitHitModal.tsx` — board frame 5 (`WebLimitHit`)
- `apps/web/src/features/billing/components/TrialEndingScreen.tsx` — board frame 9 (`WebTrialEnding`)
- `apps/web/src/features/billing/components/SubscriptionRows.tsx` — board frame 10 (settings subscription card)
- `apps/web/src/lib/revenuecat-web.ts` — thin Web Billing SDK wrapper behind `REVENUECAT_WEB_BILLING_KEY`
- Routes: `apps/web/src/routes/_authed/upgrade.tsx` (paywall; `?variant=compare` → PaywallCompare), `apps/web/src/routes/_authed/trial.tsx` (TrialEndingScreen)
- Modify: `apps/web/src/features/account/components/AccountScreen.tsx` → add `<SubscriptionRows>` (replaces the M2 stub)
- Modify: the generation flow to catch `limit_reached` and show `<LimitHitModal>` (see Step 6)

- [ ] **Step 1: Add the Web Billing dep** — `pnpm --filter @pantry/web add @revenuecat/purchases-js@<pin latest>`. Add `REVENUECAT_WEB_BILLING_KEY` to the web env loader (mirror `services/api/src/env.ts` pattern; optional string).

- [ ] **Step 2: strings.ts** — all copy from the board (titles "Cook with everything your kitchen can do.", blurbs, feature bullets, CTAs "Start 7-day free trial", reassurance row, plan features). No inline literals anywhere downstream.

- [ ] **Step 3: PlanCard + BillingToggle (TDD)** — `PlanCard.test.tsx`: renders name, formatted price for monthly vs annual, highlight badge, feature list, CTA; calls `onChoose(planId)`. Implement from `paywall-a.jsx:44-137` (PlanCard + BillingToggle), using design-system `Button`/`Card`/`Icon` and tokens — **no ad-hoc colors**; map the board's inline `T.*` to CSS-module classes referencing `var(--*)`.

- [ ] **Step 4: useBilling hook (TDD)** — state machine `{ status: 'idle'|'purchasing'|'restoring'|'error', annual, selectedPlan }`; `purchase(planId)` calls `revenuecat-web.ts` then `api.subscription.syncFromRevenueCat.mutate()` then navigates; `restore()`; surfaces errors. Test with a mocked `revenuecat-web` + mocked api client (Testing Library / vitest), asserting transitions and that a successful purchase triggers a sync.

- [ ] **Step 5: Screen components (TDD each)** — `PaywallEditorial`, `PaywallCompare`, `LimitHitModal`, `TrialEndingScreen`, `SubscriptionRows`. For each: a Testing Library test asserting the key board copy renders, the primary CTA fires the hook, and (where applicable) the close/"Maybe later" path works. Compose from `PlanCard`/`BillingToggle`/primitives, matching the board source line-for-line in structure. `TrialEndingScreen` + `SubscriptionRows` render inside `WebShell` (use the **centralized nav** from the navigation bug-fix — see "Prerequisite" below) with `activeId="dashboard"` per board (`paywall-contextual.jsx:310`, `subscription.jsx`).

- [ ] **Step 6: Wire `limit_reached` → LimitHitModal** — in the web generation submit path (`features/generation/...useGeneration` or the Home submit), catch the tRPC error with `isLimitReachedError` and open `LimitHitModal` instead of navigating. Test: a mocked client that throws `limit_reached` opens the modal.

- [ ] **Step 7: Routes** — `upgrade.tsx` and `trial.tsx` are composition-only (loader → screen), `ssr:false`, mirroring `settings.tsx`.

- [ ] **Step 8: Web gate** — `pnpm --filter @pantry/web lint && typecheck && test`. Commit per screen (frequent commits), e.g.:

```bash
git add apps/web/src/features/billing apps/web/src/routes/_authed/upgrade.tsx apps/web/src/routes/_authed/trial.tsx apps/web/src/lib/revenuecat-web.ts
git commit -m "feat(web): paywall (editorial+compare), limit-hit modal, trial-ending, subscription rows (M8)"
```

---

## Slice H — Mobile monetization UI (`apps/mobile`)

**Goal:** Build the mobile board frames (2, 4, 6, 7, 8, 11, 12, 13) + `react-native-purchases` wiring. New feature dir `apps/mobile/src/features/billing/`.

> **Pattern:** decomposed from day one (the v2 paywall/settings sheets are the cautionary tale). `useBilling.ts` hook (purchase/restore/sync), small presentational components, strings module. Sheets ride the canonical RN `BottomSheet`. Components ≤300 lines.

**Files (create unless noted):**
- `apps/mobile/src/features/billing/strings.ts`
- `apps/mobile/src/features/billing/useBilling.ts` (+ `.test.ts`)
- `apps/mobile/src/features/billing/purchases.ts` — `react-native-purchases` wrapper (`configure`, `getOfferings`, `purchasePackage`, `restorePurchases`, `logIn(userId)`)
- `apps/mobile/src/features/billing/components/PlanOption.tsx` (+ test)
- `apps/mobile/src/features/billing/components/PaywallA.tsx` — board frame 2 (`MobilePaywallA`)
- `apps/mobile/src/features/billing/components/PaywallB.tsx` — board frame 4 (`MobilePaywallB`)
- `apps/mobile/src/features/billing/components/TrialOffer.tsx` — board frame 7 (`MobileTrialOffer`)
- `apps/mobile/src/features/billing/components/TrialEnding.tsx` — board frame 8 (`MobileTrialEnding`)
- `apps/mobile/src/features/billing/sheets/LimitHitSheet.tsx` — board frame 6 (`MobileLimitHit`)
- `apps/mobile/src/features/billing/components/SubscriptionSection.tsx` — board frames 11–12–13 (settings rows by `state`)
- `apps/mobile/src/features/billing/components/ManageSubscription.tsx` — board frame 13 (`MobileManageSubscription`)
- Routes: `apps/mobile/src/app/(billing)/_layout.tsx`, `(billing)/paywall.tsx`, `(billing)/trial.tsx`, `(billing)/manage.tsx`
- Modify: `apps/mobile/src/features/account/components/AccountScreen.tsx` → add `<SubscriptionSection>` driven by `subscription.get`
- Modify: `apps/mobile/src/features/generation/useGeneration.ts` → catch `limit_reached`, present `LimitHitSheet`
- Modify: app bootstrap (`src/app/_layout.tsx`) → `Purchases.configure(...)` + `Purchases.logIn(userId)` after auth, behind a configured-key guard

- [ ] **Step 1: Add the dep** — `pnpm --filter @pantry/mobile add react-native-purchases@<pin latest>`. Because this is a native module and the project runs **Expo Go (no dev build)** per `MEMORY.md [[local-dev-runtime]]`, guard all `Purchases.*` calls behind a runtime check and a `EXPO_PUBLIC_REVENUECAT_*` key; in Expo Go the wrapper no-ops and `useBilling` falls back to the mock/sandbox path so screens still render and Maestro can drive them. Note in `docs/decisions.md` that a **dev build / EAS** is required for real purchases (defer real-purchase verification to that).

- [ ] **Step 2: purchases.ts wrapper + useBilling (TDD)** — same hook contract as web (`status`, `annual`, `selectedPlan`, `purchase`, `restore`), but `purchase` calls `Purchases.purchasePackage` then `api.subscription.syncFromRevenueCat`. Unit-test the hook with a mocked wrapper + mocked api client.

- [ ] **Step 3: strings.ts** — all board copy (mobile variants).

- [ ] **Step 4: Screen/sheet components (TDD each)** — render-and-fire tests via the RN-under-vitest infra (`MEMORY.md [[rn-testing-infra-design-system]]`; string aliases only, lucide `/icons` subpath). `SubscriptionSection` renders the three board states (free upsell banner / trial countdown / pro manage entry) from `subscription.get`. `LimitHitSheet` uses the canonical `BottomSheet`.

- [ ] **Step 5: Routes + bootstrap wiring + limit_reached handling** — as listed above; `(tabs)/me.tsx` Account composes `SubscriptionSection`; generation surfaces `LimitHitSheet`.

- [ ] **Step 6: Mobile gate** — `pnpm --filter @pantry/mobile lint && typecheck && test`. Commit (split sensibly):

```bash
git add apps/mobile/src/features/billing apps/mobile/src/app/(billing) apps/mobile/src/app/_layout.tsx
git commit -m "feat(mobile): paywalls A/B, limit-hit sheet, trial offer/ending, settings subscription + manage (M8)"
```

---

## Slice I — Navigation prerequisite (web), screenshot gate, e2e, decisions, roadmap

> **Prerequisite (do FIRST, before Slice G screens that render `WebShell`):** the separate **navigation bug-fix** (centralized `useShellNav` in `apps/web/src/features/pantry-shared/`, Shopping removed, `min-height:100dvh`, real Home at `/home` as the Dashboard tab) must be merged so the new web screens get clickable, board-faithful nav for free. If that fix has already landed, skip; otherwise land it as its own commit/PR before Slice G.

- [ ] **Step 1: Capture reference frames** — run the `tools/design-fidelity` reference capture for the 13 board frames (it already locates frames by `.frame-label`/`data-screen-label`). Commit the new reference PNGs.

- [ ] **Step 2: App capture + report** — web via Playwright at 1280×860 with mock-data fixtures (free/trial/pro states); mobile via `xcrun simctl io screenshot` on the pinned device with status-bar override + frozen clock (trial "2 days left" needs a frozen clock — set the fixture date so the countdown math matches the board: started Apr 26, today day 5 of 7, billing May 3). Generate the side-by-side report.

- [ ] **Step 3: Fidelity approval** — record per-frame approval in a new `docs/checklists/m8-monetization.md` (mirror `docs/checklists/m7-recipe-chat.md`). Human approves layout/spacing/type/color; pixelmatch threshold becomes the regression tripwire.

- [ ] **Step 4: e2e — limit-hit → paywall → unlock**
  - Web Playwright `e2e/web/specs/paywall.spec.ts`: seed a free user at the weekly limit (via API/test fixture) → trigger generation → assert `LimitHitModal` appears → "Start free trial" → (mock/sandbox purchase) → entitlement flips (mock webhook or `syncFromRevenueCat` stub) → generation now allowed.
  - Mobile Maestro `e2e/mobile/paywall.yaml`: limit-hit sheet → paywall → mock purchase → settings shows Pro.

- [ ] **Step 5: Webhook fixture tests** are already in Slice E — confirm they run in CI (postgres service).

- [ ] **Step 6: Decisions log** — append to `docs/decisions.md`: weekly free window (decision #1), `tier` enum (#2), Web Billing behind env guard + Expo-Go no-op for purchases (#3 + dev-build requirement), any board-silent composition (e.g. error/empty states on paywall).

- [ ] **Step 7: Roadmap update** — in `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md` Status table, set **M8** to `impl complete · fidelity review pending` (or `done` once frames approved), linking this plan and the checklist, in the same prose style as the M7 row.

- [ ] **Step 8: Full repo gate + final commit**

Run (postgres up): `pnpm lint && pnpm typecheck && pnpm test && pnpm -r build`
Expected: all green.

```bash
git add docs/checklists/m8-monetization.md docs/decisions.md docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md e2e tools/design-fidelity
git commit -m "docs(m8): fidelity checklist + e2e + decisions + roadmap (M8 complete)"
```

---

## Self-review checklist (run before handing off)

- **Spec coverage vs roadmap §M8:** RevenueCat mobile (Slice H) ✓ · web Web Billing (Slice G) ✓ · idempotent signature/auth webhook (Slice E) ✓ · entitlement middleware on generation/scan (Slice D) ✓ · usage counters (Slice C) ✓ · trial lifecycle (subState derivation C + trial screens G/H) ✓ · top-up credits (ledger C + NON_RENEWING_PURCHASE grant E) ✓ · 13 screens (G+H) ✓ · webhook fixture tests (E) ✓ · e2e limit-hit→paywall→unlock (I) ✓.
- **Type consistency:** `SubscriptionState`/`UsageState`/`tier`/`SubState` names identical across contracts → schema → service → router → clients. `assertAiActionAllowed` / `getAiQuotaState` signatures consistent (now `env`-aware via `ctx`).
- **No placeholders:** every step names exact files + commands; backend steps carry real code; UI steps name the exact board source + the strings/primitives to compose from (the repo's established screenshot-gated screen pattern).
- **Open decisions** surfaced at top — confirm before Slice C.
```
