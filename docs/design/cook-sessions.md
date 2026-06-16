# Cook sessions + consume flow (M6)

Short design doc for the net-new cook-session vertical (no v2 precedent — v2 never persisted
cook sessions). Board references: §03.5 in-session, §03 resume banner, §★ consume flow.

## State machine

A `cook_sessions` row moves through three states:

```
            cook.start                 cook.consume
   (none) ───────────▶ active ───────────────────────▶ completed
                         │
                         │ cook.abandon  (or cook.start of another recipe)
                         ▼
                      abandoned
```

- **One active session per user.** `cook.start` first marks any existing `active` session
  `abandoned`, then inserts a fresh one at `currentStepIndex = 0`. The board shows a single
  "On the stove" banner, so a second concurrent session never exists.
- **Resume** = read the user's `active` session (`cook.getActive`). It survives an app kill
  because the row (recipe + current step + `startedAt`) is in the DB.
- Terminal states (`completed`, `abandoned`) are never reopened; cooking the same recipe again
  starts a new row.

## Timer model (client-side, not persisted)

Only `currentStepIndex` + `startedAt` persist. The countdown ring is **seeded from the current
step's `durationMinutes`** and ticks in `useCookSession` (a 1s interval, reset on step change).
Rationale: persisting a live countdown would mean per-second DB writes for no real benefit — on
resume we re-seed the ring from the step's duration. Frozen-clock fixtures drive the screenshot
gate so captures are deterministic.

`recipeStep = { text, label?, durationMinutes? }`. `label` is a short verb shown above the step
("simmer"); `durationMinutes` seeds the ring for active-wait steps and is omitted for instant
prep. The read path coerces legacy `string` steps to `{ text }`, so M4 recipes still render.

## Consume transaction

`cook.consume({ sessionId, items })` runs in a single DB transaction:

1. Load the session (must be the caller's and `active`).
2. For each item: load the caller's pantry row, compute `deduct(have, quantityUsed)` →
   `{ remaining, finished }`, write an `inventory_events` row (kind `'consumed'`,
   `quantityDelta = -quantityUsed`), then **remove** the item if used up (`finished` or the
   client's "Used it all" flag) or **reduce** its quantity to `remaining`.
3. Mark the session `completed` (`completedAt = now`).

Atomicity matters: a mid-way failure (e.g. an item that isn't the caller's → `NOT_FOUND`) rolls
the whole thing back — no partial pantry edits, session stays `active`.

`inventory_events.item_id` is nullable with `ON DELETE SET NULL` (migration 0006) so a
`consumed` audit row outlives a removed item. The "as recipe / used more / used less / Used it
all" pills are UI affordances that set the numeric `quantityUsed` (+ `finished`); the contract
carries only resolved numbers.

## Platform split

- **Web · in session (§03.5):** light layout with an inverse "Cooking now" banner; the large
  step, ingredients + countdown-ring cards, prev/next nav. Finishing completes the session with
  no deductions (the editable consume flow is mobile). A resume banner shows on the library.
- **Mobile · in session (§03.5):** full **dark stove** screen (token overrides via the generated
  `tokens.stove` group): progress segments, circular timer, warning chip, up-next, nav. Exiting
  (X) leaves the session resumable. On the last step → **End-of-cook ask** (§★) with a deduction
  receipt → "I cooked this" deducts the recipe defaults, "Adjust what was used" opens the
  **Consume sheet** (§★, editable per-ingredient steppers + pills + missing box) on the animated
  canonical `BottomSheet`. A §03 resume banner shows on the Cook library.

## Key modules

| Concern | Path |
| ------- | ---- |
| Contracts | `packages/contracts/src/cook/{session,consume}.ts`, `recipes/recipe.ts` (steps) |
| Deduction math | `packages/utils/src/quantity.ts` |
| DB | `services/api/src/db/schema/cook-sessions.ts`, migrations `0005`/`0006` |
| API | `services/api/src/trpc/routers/cook.ts` |
| Web UI | `apps/web/src/features/cook/*`, `routes/_authed/cook.session.tsx` |
| Mobile UI | `apps/mobile/src/features/cook/*`, `app/(cook)/session.tsx` |
| Stove theme | `packages/design-system/src/styles/tokens.css` (`.theme-stove`) → generated `tokens.stove` |
