# M6 — Cook sessions + consume flow

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking. TDD per slice; run `pnpm lint && pnpm typecheck &&
> pnpm test` before any commit that claims completion (postgres up first via
> `podman compose -f infra/podman/compose.yaml up -d`).
>
> **Before starting:** set M6 to `in progress` in the roadmap Status table
> (`docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md`) and link this plan.
> **On completion:** mark M6 done in that table and commit.

## Goal

Ship the cook-session vertical slice — board §03.5 in-session (web **Cook · in session** +
mobile dark **stove** screen), §03 **resume banner**, and §★ **consume flow** (mobile
**End-of-cook ask** + **Consume sheet** + result **pantry inline**). Cooking a library recipe
becomes a persisted, resumable session that, on finish, deducts pantry quantities and writes
inventory events. Plus an in-milestone UX fix: the mobile canonical `BottomSheet` must
**slide in/out** instead of popping in instantly.

## Architecture

Vertical slice in roadmap order **design doc → contracts → DB → AI → API → web UI → mobile UI
→ fidelity gate → e2e**, with two front-loaded enablers (the BottomSheet fix and the
structured-step recipe upgrade) since later slices depend on them.

- **Design doc first** (`docs/design/cook-sessions.md`, net-new per roadmap): session state
  machine (`active → completed | abandoned`), resume semantics (one active session per user;
  survives app kill via DB), timer model (client-side countdown seeded from `durationMinutes`,
  **not** persisted to the second; only `currentStepIndex` + `startedAt` persist), consume
  transaction shape.
- **Structured steps**: `recipeStepSchema` in `@pantry/contracts`; `AIRecipe.steps` becomes
  `recipeStep[]`; tolerant parse coerces legacy `string` → `{ text }`. AI prompts +
  `recipe-partial-emitter` stream step objects.
- **DB**: net-new `cook_sessions` table + enum, migration `0005`. New deduction math in
  `@pantry/utils`. Consume = transactional pantry updates + `inventory_events`.
- **API**: a `cook` tRPC router — session lifecycle + a transactional `consume` mutation.
- **Dark stove theme**: token overrides only — web via a `.theme-stove` scope remapping CSS
  vars; RN via a `tokens.stove.*` group in `native.ts` (generated from the CSS source, per the
  M0 rule that the RN mirror is generated, never hand-maintained).

**Tech stack:** Zod (`@pantry/contracts`) · Drizzle + PostgreSQL (`cook_sessions` + migration
`0005`) · tRPC v11 · React Native `Animated` (BottomSheet fix, mirroring v2 `MBottomSheet`) ·
CSS Modules + token overrides (web) · Vitest + Testing Library + Playwright (web) + Maestro
(mobile).

## Context

M5 turned the Cook tab into a recipe **library** and shipped recipe detail + live favorites,
and deferred all "recent / recently cooked / session" data to M6 (decision C). M6 is the
net-new vertical the roadmap flagged as having **no v2 precedent** — v2 never persisted cook
sessions — so the design board is the only spec. The repo sits at zero TS errors / zero lint
warnings across all workspaces.

Two things drive this milestone:

1. **Roadmap M6 scope** (board §03.5 in-session, §03 resume, §★ consume): persisted resumable
   `cook_sessions`; a consume transaction that deducts pantry quantities and writes inventory
   events; web Cook·in-session (dark stove theme **via token overrides, not ad-hoc colors**);
   mobile in-session, resume banner, End-of-cook ask, Consume sheet with editable quantities.
2. **A confirmed UX bug:** the mobile canonical `BottomSheet`
   (`packages/design-system/src/native/BottomSheet/BottomSheet.tsx`) renders with
   `Modal animationType="none"` and no `Animated` orchestration, so it pops in instantly. Every
   mobile picker/ask/consume sheet rides this primitive, so it must be fixed before the Consume
   sheet ships.

**Decision taken with the user (2026-06-16):** in-session step timers are **structured +
AI-populated**, not display-only. Recipe steps become `{ text, label?, durationMinutes? }`, the
AI prompts/streaming emit them, and a tolerant read path normalizes already-persisted
plain-string steps. This intentionally reopens the M4 recipe contract + generation pipeline.

## Frames (board references → fidelity gate)

| #  | Frame label (board)              | Section | Platform | Source (v2 reference) | Notes |
| -- | -------------------------------- | ------- | -------- | --------------------- | ----- |
| 1  | Web · Cook · in session          | §03.5   | web      | `screens/home-cook-v2.jsx` `WebCookTab` (~L1024) | Inverse "Cooking now" banner (pulse dot, started-at, Exit) + large step heading + ingredients/timer cards |
| 2  | Mobile · Cook · in session       | §03.5   | mobile   | `screens/home-cook-v2.jsx` `MobileCookTab` (~L1226) | Full **dark stove** screen: progress segments, step label, 38px heading, circular timer ring, warning chip, "Up next", back + "Next" buttons |
| 3  | Mobile · Cook · resume banner    | §03     | mobile   | `screens/home-cook-v2.jsx` `MobileCookTabResume` (~L1425) | Dark banner on the library: flame icon, "On the stove · {stepLabel} · {timer}", title, "Resume →" |
| 4  | Mobile · End of cook · the ask   | §★      | mobile   | `screens/consume-flow.jsx` `MobileCookFinishedPrompt` (~L169) | Dark topbar ("Step 4 of 4 · finished"), "Plate it up. / Did you actually cook it?", dotted "Will deduct" receipt, "I cooked this · update pantry" / "Adjust what was used" / "Not now" |
| 5  | Mobile · Consume sheet           | §★      | mobile   | `screens/consume-flow.jsx` `ConsumeSheet` (~L273) | Canonical `BottomSheet`: info banner, per-ingredient editable `ConsumeRow` steppers (−/qty/+) + context pills ("Used it all" / "as recipe"/"used more"/"used less"), missing-ingredient box, "Deduct from pantry" / "Skip" |
| 6  | Mobile · Result · pantry inline  | §★-1    | mobile   | `screens/consume-flow.jsx` `MobileResultWithPantry` (~L62) | "Using from your pantry · 4 of 5" dashed block on the result; re-verify against M4 result (may already exist) and wire the in-session entry point |

Capture surfaces, frozen-clock fixtures, and the side-by-side report follow the
`tools/design-fidelity` workflow; approval recorded in `docs/checklists/m6-cook-sessions.md`.

## Scope decisions (to log in `docs/decisions.md` under "2026-06-16 — M6")

- **(A) Structured recipe steps replace plain strings.** `AIRecipe.steps: recipeStep[]` where
  `recipeStep = { text, label?, durationMinutes? }`. Read path tolerates legacy `string[]`
  (coerced to `{ text }`) so already-persisted M4 recipes still parse; no data backfill. AI
  prompts emit `label` (short verb, e.g. "simmer") + `durationMinutes` when a step is timed.
- **(B) One active session per user.** `cook.start` abandons any existing `active` session for
  the user before creating the new one (board shows a single "On the stove" banner). Resume =
  read the user's `active` session.
- **(C) Timers are client-side, not persisted.** Only `currentStepIndex` + `startedAt` persist;
  the countdown ring is seeded from `durationMinutes` and runs in a hook. Frozen-clock fixtures
  drive the screenshot gate. Avoids per-second DB writes.
- **(D) Consume is a single transaction.** `cook.consume` deducts each chosen pantry item's
  quantity, writes an `inventory_events` row per item, and marks the session `completed` —
  atomically. Add a `'consumed'` value to the inventory-event kind enum rather than overloading
  `'adjusted'`.
- **(E) "as recipe / used more / used less / Used it all" pills are UI affordances** that set the
  numeric `quantityUsed` (and a `finished` flag); the contract carries only the resolved numbers.
- **(F) Dark stove theme via token overrides.** Web: `.theme-stove` class remaps CSS vars
  (`--bg`→inverse, `--fg`→on-inverse, plus `--accent-strong` #A4C46B). RN: a `tokens.stove`
  group generated into `native.ts`. No ad-hoc hex in components.
- **(G) BottomSheet slide-in fix** ports v2's `Animated.parallel` pattern (backdrop fade + sheet
  `translateY` from screen height → 0 on open; reverse + delayed unmount on close).

## Key v2 reference files (consult, never copy)

| Concern | Path (under `pantry-copilot-v2/`) |
| ------- | --------------------------------- |
| In-session / resume markup | `claudeDesignOutput/screens/home-cook-v2.jsx` (`WebCookTab`, `MobileCookTab`, `MobileCookTabResume`) |
| Consume flow markup | `claudeDesignOutput/screens/consume-flow.jsx` (`MobileResultWithPantry`, `MobileCookFinishedPrompt`, `ConsumeSheet`, `ConsumeRow`, `PantryUsageRow`) |
| BottomSheet slide animation | `apps/mobile/src/components/MBottomSheet.tsx` (`Animated.parallel` enter/exit, `mounted` lifecycle) |
| Tokens (inverse / accent-strong) | `claudeDesignOutput/design-system/tokens.css` |

## Domain model additions

```ts
// contracts/recipes/recipe.ts — structured steps (tolerant of legacy strings)
export const recipeStepSchema = z.object({
  text: z.string().min(1),
  label: z.string().min(1).optional(),          // short verb, e.g. "simmer"
  durationMinutes: z.number().int().min(1).optional(),
});
export type RecipeStep = z.infer<typeof recipeStepSchema>;
const stepInput = z.union([z.string().transform((t) => ({ text: t })), recipeStepSchema]);
// AIRecipe.steps: z.array(stepInput).pipe(z.array(recipeStepSchema))

// contracts/cook/session.ts
export const COOK_SESSION_STATUSES = ['active', 'completed', 'abandoned'] as const;
export const cookSessionSchema = z.object({
  id: z.uuid(), recipeId: z.uuid(), status: z.enum(COOK_SESSION_STATUSES),
  currentStepIndex: z.number().int().min(0), totalSteps: z.number().int().min(1),
  recipeTitle: z.string(), startedAt: z.string(),
});
export const startSessionInputSchema = z.object({ recipeId: z.uuid() });
export const advanceStepInputSchema = z.object({ sessionId: z.uuid(), stepIndex: z.number().int().min(0) });

// contracts/cook/consume.ts
export const consumeItemSchema = z.object({
  pantryItemId: z.uuid(), quantityUsed: z.number().min(0), unit: unitSchema, finished: z.boolean(),
});
export const consumeInputSchema = z.object({ sessionId: z.uuid(), items: z.array(consumeItemSchema) });
```

`cook_sessions` (Drizzle, `services/api/src/db/schema/cook-sessions.ts`): `id` uuid pk,
`userId` → users (cascade), `recipeId` → recipes (cascade), `status` pgEnum
`cook_session_status`, `currentStepIndex` int default 0, `startedAt`/`createdAt`/`updatedAt`,
`completedAt` nullable. Migration `0005_*.sql` via `pnpm --filter @pantry/api db:generate`.

## Slices

### Slice 0 — BottomSheet slide-in fix (design-system, native)

- **Files:** `packages/design-system/src/native/BottomSheet/BottomSheet.tsx`,
  `BottomSheet.test.tsx`.
- [ ] TDD: add a test asserting the sheet stays mounted through close (delayed unmount) and that
  an animated transform/`translateY` style is applied (assert presence of the animated style,
  not timing). Run — fail.
- [ ] Port v2's pattern: `useRef` `Animated.Value`s for scrim opacity + sheet `translateY`, a
  `mounted` state, a `useEffect(open)` running `Animated.parallel` (backdrop fade ~180ms
  `Easing.out(quad)`, slide ~260ms `Easing.out(cubic)`) on open and the reverse +
  `setMounted(false)` on close; keep `Modal animationType="none"` (we own the animation) but
  render via `mounted`. `useNativeDriver: true`.
- [ ] Verify all 5 call sites still pass (`NewAskSheet`, `CategorySheet`, `LocationSheet`,
  `BestBySheet`, `PantryPickSheet`); run `pnpm --filter @pantry/design-system test`.
- [ ] Commit: `fix(design-system): animate mobile BottomSheet slide-in/out`.

### Slice A — Structured recipe steps (contracts)

- **Files:** `packages/contracts/src/recipes/recipe.ts` (+ `recipe.test.ts`), barrel export.
- [ ] TDD `recipeStepSchema` + the legacy-string coercion union; AIRecipe `steps` migrates to
  `recipeStep[]`; tests prove plain-string and structured inputs both parse and that durations
  validate. Run fail → implement → pass.
- [ ] Commit: `feat(contracts): structured recipe steps with optional timer`.

### Slice B — AI emits structured steps (services/ai)

- **Files:** `services/ai/src/prompts/recipes.ts`, the partial emitter / stream orchestrator,
  mock provider fixtures + tests.
- [ ] Update the recipe prompt/JSON shape so steps carry `text`/`label?`/`durationMinutes?`;
  update `recipe-partial-emitter` to stream step objects (drafting beat still streams
  top→bottom). Update the **mock provider event tape** so the M4 streaming tests + the M6
  in-session fixtures have timed steps.
- [ ] TDD: orchestrator/emitter unit tests for structured steps; confirm M4 stream tests stay
  green. Commit: `feat(ai): emit structured recipe steps (label + duration)`.

### Slice C — DB + deduction math (services/api, packages/utils)

- **Files:** `services/api/src/db/schema/cook-sessions.ts` + schema barrel + `drizzle/0005_*.sql`;
  add `'consumed'` to the inventory-event kind enum; `packages/utils/src/quantity.ts` (+ test).
- [ ] TDD `quantity.ts`: `deduct(have, used, unit)` → remaining + whether the item is finished
  (used-it-all → 0/remove); handle partial and over-use clamping. Pure, unit-tested.
- [ ] Add `cook_sessions` table + `cook_session_status` enum; generate + apply migration `0005`.
- [ ] Commit: `feat(api): cook_sessions table + deduction math (utils)`.

### Slice D — Cook API (services/api)

- **Files:** new `services/api/src/trpc/routers/cook.ts`, mount in `trpc/router.ts`,
  `test/cook-sessions.integration.test.ts`.
- [ ] `cook.start(recipeId)` — abandon existing active session, create one, return DTO (with
  `totalSteps` from the recipe `data.steps`). `cook.getActive()` — the resume source.
  `cook.advanceStep({sessionId, stepIndex})`. `cook.abandon({sessionId})`.
  `cook.consume(consumeInput)` — **transaction**: per item deduct pantry quantity via
  `quantity.deduct`, write `inventory_events` (kind `'consumed'`), mark session `completed`.
- [ ] TDD integration (mirror `recipes-library.integration.test.ts`): per-user scoping,
  single-active-session invariant, step progression, resume, consume reduces pantry + writes
  events atomically, 404 cross-user, UNAUTHORIZED. Commit:
  `feat(api): cook session lifecycle + consume transaction`.

### Slice E — Web UI (apps/web)

- **Files:** `routes/_authed/cook.session.tsx` (composition-only), `features/cook/components/*`,
  `features/cook/useCookSession.ts`, `cook.module.css`, `features/cook/strings.ts`; dark theme
  via a `.theme-stove` scope in design-system styles.
- [ ] Resume "Cooking now" banner on the library; in-session view (step heading, ingredients +
  timer cards, next-step, prev/next nav) under the stove theme; wire start (from recipe detail)
  → advance → finish. Timer ring driven by `useCookSession` from `durationMinutes` (frozen-clock
  fixture for capture).
- [ ] Tests: Testing Library for the in-session components + a Playwright happy path
  `e2e/web/specs/cook.spec.ts` (start → step → finish). Commit:
  `feat(web): cook in-session + resume (stove theme)`.

### Slice F — Mobile UI (apps/mobile)

- **Files:** `app/(tabs)/cook.tsx` (resume banner injection), new in-session route/screen,
  `features/cook/components/*` (each ≤300 LOC; state in `useCookSession`),
  `features/cook/sheets/ConsumeSheet.tsx`, `features/cook/strings.ts`; `tokens.stove` group.
- [ ] Resume banner (flame, "On the stove", Resume); dark-stove in-session screen (progress
  segments, circular timer, warning chip, Up-next, nav); End-of-cook ask; **ConsumeSheet** on
  the now-animated canonical `BottomSheet` with editable `ConsumeRow` steppers + context pills +
  missing-ingredient box.
- [ ] Tests: `useCookSession` hook tests + component tests; one Maestro flow
  `e2e/mobile/cook.yaml` (start → advance → finish → consume). Commit:
  `feat(mobile): cook in-session, resume, end-of-cook, consume sheet`.

### Slice G — Fidelity gate + docs

- [ ] Capture the 6 frames, generate the side-by-side report, record approvals in
  `docs/checklists/m6-cook-sessions.md`.
- [ ] Log decisions A–G in `docs/decisions.md`; write `docs/design/cook-sessions.md`; flip M6 →
  done in the roadmap Status table and link this plan. Commit.

## Verification

1. **Unit/contract:** `pnpm test` green — contracts (recipe steps, cook session, consume),
   `@pantry/utils` deduction math, AI orchestrator/emitter, API cook integration vs ephemeral
   postgres, web component + mobile hook tests. (Postgres up via `podman compose` first.)
2. **Types & lint:** `pnpm typecheck` (0 errors, all workspaces) + `pnpm lint`
   (`--max-warnings 0`, no `eslint-disable`, no `any`, components ≤300 LOC, route files
   composition-only).
3. **Build:** `pnpm -r build` succeeds.
4. **DB:** `db:migrate` applies `0005_*` on a fresh DB; legacy plain-string recipes still parse
   via the tolerant step schema.
5. **BottomSheet:** manual check on device/sim — sheets slide up on open and down on close (no
   instant pop); all 5 existing sheets unaffected.
6. **e2e happy path:** `e2e/web/specs/cook.spec.ts` and `e2e/mobile/cook.yaml`: start →
   kill/reopen → resume → finish → consume → **pantry quantities reduced + inventory events
   written**.
7. **Fidelity:** all 6 board frames approved in `docs/checklists/m6-cook-sessions.md`;
   `podman compose up` boots the full stack.

## Self-review notes

- Maps to roadmap M6 line-by-line: persisted resumable `cook_sessions`, consume transaction →
  pantry deductions + inventory events, web stove-theme in-session, mobile in-session + resume
  banner + end-of-cook ask + editable consume sheet; ~6 frames; deduction math unit tests; e2e
  start→kill/reopen→resume→finish→consume→pantry reduced.
- Honors the M6 "short design doc first" requirement (net-new, no v2 precedent).
- Bundles the BottomSheet slide-in fix (Slice 0) since the Consume sheet depends on it.
- Structured-step upgrade (user decision) is sequenced first so the in-session timer UI renders
  real data; backward-compatible read path means no destructive data migration.
- No new visual language: stove theme is token overrides; sheets/cards/buttons reuse existing
  primitives; any board-silent state composed from primitives + logged in decisions.
