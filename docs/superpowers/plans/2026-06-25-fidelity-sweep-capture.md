# Fidelity Sweep Capture & Sign-off Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture every still-pending fidelity frame and produce side-by-side comparison reports so the maintainer can sign off the M2–M9 fidelity gates — fully autonomously for the 18 web frames, and via a tooling fix + a hardware step for the 37 mobile frames.

**Architecture:** The fidelity harness (`tools/design-fidelity`) already serves the design board, holds committed reference captures (`references/*.png` + `manifest.json`), and diffs them against app captures in `output/app/` via `sweep.ts`. Web capture is headless Playwright driving a locally-booted stack; it is reproducible in this session. Mobile capture needs a booted iOS simulator + the Expo app and currently has a resolution-normalization bug. We extend web capture to all 18 frames, fix the mobile normalization, then hand mobile screenshotting to a maintainer.

**Tech Stack:** Playwright 1.60, pixelmatch 7, pngjs 7, tsx; the v3 stack (TanStack Start web on :3000, Fastify/tRPC api on :4000, AI service on :4001, postgres via podman); macOS `sips` for image resize; `xcrun simctl` for mobile.

## Global Constraints

- **Design bible:** `/Users/mackmindenhall/Documents/pantry-copilot-v2/claudeDesignOutput/All Screens.html`. The committed `references/*.png` are the source of truth; do **not** re-capture references.
- **Gate = human approval**, not pixel-identity. The pixelmatch % is a regression tripwire on already-approved frames, not an auto-pass. Final sign-off is the maintainer's.
- **Capture geometry is fixed:** web frames at viewport `1280×861`, `deviceScaleFactor: 2` (→ 2560×1722 PNG). Never change these — they must match the reference dims.
- **No new runtime deps.** Image resize uses macOS-native `sips` (the mobile path is macOS-only already). No `any`, no `eslint-disable`, `--max-warnings 0`; tool scripts stay focused (split rather than grow a file past ~300 lines).
- **Mock AI provider only** for capture (`AI_PROVIDER=mock`), so streaming/generation states are deterministic. Never hit live providers.
- **Reference captures, frame slugs, and the manifest are frozen.** Capture output filenames must equal `<slug>.png` exactly as listed in `docs/checklists/m9-fidelity-sweep.md`, or the sweep reports them missing.

---

## What is and isn't autonomous (read before starting)

| Surface | Autonomous here? | Why |
| --- | --- | --- |
| **18 web frames** | **Yes** — capture + diff + report end-to-end | Headless Playwright against a locally-booted stack; all state seedable via signup + tRPC + DB. |
| **Mobile tooling (normalization, deep-link map)** | **Yes** | Pure script edits in `tools/design-fidelity`. |
| **37 mobile frame screenshots** | **No** | Needs a booted iOS simulator + running Expo app; several mid-flow frames (sheets, scan/generate beats, selecting states) have no deep link yet. This is a maintainer/hardware step (matches `docs/launch-readiness.md`). |
| **Final approval (web & mobile)** | **No** | The gate is explicit human review of `report.html`. The agent produces the report and a first-pass assessment; the maintainer records approvals. |

Current capture coverage: web 5/18 (`login`, `home`, `thinking`, `drafting`, `result` — from `capture-app-web.ts` + `capture-m4-web.ts`). Mobile 7 captured but **all unusable**: references are 780×1602 (board device element) while simulator screenshots are 1178×2556, so the sweep's pad-to-max diff yields ~60% mismatch from scale alone, not fidelity.

---

## File structure

- `tools/design-fidelity/src/capture-web-lib.ts` — **Create.** Shared web helpers: `signUp(page)`, `seedPantry(page, items)`, `seedState(page, payload)` (subscription/quota/cook-session seeding via tRPC/dev endpoint), `settleFonts(page)`, `shoot(page, slug)`. DRYs the pattern proven in `capture-m4-web.ts`.
- `tools/design-fidelity/src/capture-m2-web.ts` — **Create.** §05/§06/§09 web frames.
- `tools/design-fidelity/src/capture-m5-web.ts` — **Create.** §03/§05 web frames.
- `tools/design-fidelity/src/capture-m6-web.ts` — **Create.** §03.5 web in-session frame.
- `tools/design-fidelity/src/capture-m7-web.ts` — **Create.** §✦ chat web frames.
- `tools/design-fidelity/src/capture-m8-web.ts` — **Create.** §11–§15 paywall/settings web frames.
- `tools/design-fidelity/src/capture-app-mobile.ts` — **Modify.** Resize each screenshot to reference width via `sips`; expand `ROUTES`.
- `tools/design-fidelity/package.json` — **Modify.** Add `capture:m2|m5|m6|m7|m8` + a `capture:web:all` aggregate script.
- `tools/design-fidelity/src/sweep.ts` — **Modify (test-backed).** Add a `normalizeForDiff` step so differently-sized captures are scaled, not just padded.
- `docs/checklists/m2-pantry.md`, `m5-library.md`, `m6-cook-sessions.md`, `m7-recipe-chat.md`, `m8-monetization.md`, `m9-fidelity-sweep.md` — **Modify.** Record mismatch %s + approvals.
- `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md` — **Modify.** Flip Status states once approved.

Web routes (confirmed in `apps/web/src/routes`): `/login` `/signup` `/home` `/cook` (`cook.index`, library/empty) `/cook/generate` `/cook/session` (in-session stove) `/pantry` (`pantry.index`) `/pantry/new` `/pantry/$itemId` `/recipes` `/recipes/$recipeId` (`?chat` opens the co-pilot panel) `/settings` `/trial` `/upgrade`.

---

## Phase 0 — Boot the capture stack

### Task 1: Bring up postgres + api + ai (mock) + web for capture

**Files:** none (process orchestration only).

**Interfaces:**
- Produces: a running stack — api `:4000`, ai `:4001` (mock provider, slow stream), web `:3000`, postgres `:5432` — that every Phase A capture script drives.

- [ ] **Step 1: Start postgres**

Run: `podman compose -f infra/podman/compose.yaml up -d postgres`
Expected: container healthy; `pg_isready` succeeds (the api suite already depends on this).

- [ ] **Step 2: Start the AI service in mock mode with a slow stream**

Run (background): `AI_PROVIDER=mock MOCK_STREAM_DELAY_MS=1000 pnpm --filter @pantry/ai dev`
Expected: `curl -fsS localhost:4001/health` → ok; `curl -fsS localhost:4001/ready` → ok. The 1 s delay freezes the thinking/drafting beats long enough to screenshot (same trick `capture-m4-web.ts` relies on).

- [ ] **Step 3: Start the api**

Run (background): `pnpm --filter @pantry/api dev`
Expected: `curl -fsS localhost:4000/health` → ok.

- [ ] **Step 4: Start the web app**

Run (background): `pnpm --filter @pantry/web dev`
Expected: `curl -sS -o /dev/null -w "%{http_code}" -L localhost:3000/login` → 200. (First hit to each route triggers a cold Vite compile — capture scripts already set a 60 s default timeout for this.)

- [ ] **Step 5: Sanity-check the existing M4 capture still works against this stack**

Run: `pnpm --filter @pantry/design-fidelity capture:web` then `tsx src/capture-m4-web.ts`
Expected: `output/app/marketing-auth--web-login.png`, `home--web-home.png`, `generating-state--web-1-thinking.png`, `…2-drafting.png`, `result-after-generation--web-result.png` all (re)written. This proves the stack + signup + seed + mock-stream path before extending it.

---

## Phase A — Web capture (autonomous)

### Task 2: Shared web-capture helper

**Files:**
- Create: `tools/design-fidelity/src/capture-web-lib.ts`

**Interfaces:**
- Consumes: the running stack from Task 1.
- Produces:
  - `signUp(page: Page): Promise<string>` — signs up a fresh `fidelity-<ts>@example.com` user via `/signup`, waits for `/home`, returns the email.
  - `seedPantry(page: Page, items: PantryItem[]): Promise<void>` — POSTs each item to `${API}/trpc/pantry.create` with `credentials: 'include'`.
  - `seedState(page: Page, payload: SeedPayload): Promise<void>` — calls the api's dev-only seed mutation to set subscription tier / quota counters / an active cook session (see Step 1 note).
  - `settleFonts(page: Page): Promise<void>` — `await document.fonts.ready`.
  - `shoot(page: Page, slug: string): Promise<void>` — `settleFonts` + 300 ms + `page.screenshot({ path: output/app/<slug>.png })`.
  - `newPage(browser): Promise<Page>` — page at `1280×861`, `deviceScaleFactor: 2`, default timeout 60 s.
  - exported const `SEED_PANTRY` (the 3-item milk/scallions/apples fixture from `capture-m4-web.ts`).

- [ ] **Step 1: Confirm the dev seed entry point**

Search the api for a dev-only seeding mutation (subscription tier, weekly quota counters, cook-session start): `rg -n "dev|seed|__test|quota|entitlement" services/api/src --glob '*.ts' -l`. If a dev seed router exists, `seedState` calls it. If not, `seedState` composes existing tRPC mutations (`subscription.*`, `cook.start`, generate-to-exhaust-quota) — record which in a comment. **Do not add production endpoints**; dev-only, guarded by the existing dev flag.

- [ ] **Step 2: Write the helper module**

Lift `isoIn`, `settleFonts`, signup, and the pantry-seed loop verbatim from `capture-m4-web.ts:17-61` into typed exports. Keep `API`/`WEB` constants. File stays well under 300 lines.

- [ ] **Step 3: Typecheck the helper**

Run: `pnpm --filter @pantry/design-fidelity typecheck`
Expected: PASS (no `any`, all Playwright types resolved).

- [ ] **Step 4: Commit**

```bash
git add tools/design-fidelity/src/capture-web-lib.ts
git commit -m "tools(fidelity): shared web-capture helpers"
```

### Task 3: M2 web frames (inventory, ingredient form, account)

**Files:**
- Create: `tools/design-fidelity/src/capture-m2-web.ts`
- Modify: `tools/design-fidelity/package.json` (add `"capture:m2": "tsx src/capture-m2-web.ts"`)

**Interfaces:**
- Consumes: `capture-web-lib` (`signUp`, `seedPantry`, `SEED_PANTRY`, `shoot`, `newPage`).
- Produces: `output/app/inventory-recipe-detail--web-inventory-full-pantry.png`, `ingredient-form-account--web-ingredient-form.png`, `ingredient-form-account--web-user-account.png`.

- [ ] **Step 1: Write the capture script**

Pattern: launch chromium → `newPage` → `signUp` → `seedPantry(page, SEED_PANTRY)` (extend the fixture so the pantry reads "full" to match the reference — compare against `references/inventory-recipe-detail--web-inventory-full-pantry.png` and add items until the list density matches). Then:
- `/pantry` → wait for the inventory list heading → `shoot(page, 'inventory-recipe-detail--web-inventory-full-pantry')`.
- `/pantry/new` → wait for the form's first field → `shoot(page, 'ingredient-form-account--web-ingredient-form')`.
- `/settings` → wait for the account header → `shoot(page, 'ingredient-form-account--web-user-account')`.

Use role/label selectors (`getByRole`, `getByLabel`) as in `capture-m4-web.ts`; confirm the exact heading text against each feature's `strings.ts`.

- [ ] **Step 2: Run it**

Run: `pnpm --filter @pantry/design-fidelity capture:m2`
Expected: three `captured → …` log lines; three PNGs in `output/app/` at 2560×1722 (`file output/app/<slug>.png`).

- [ ] **Step 3: Diff each against its reference**

Run for each slug: `tsx src/compare.ts references/<slug>.png output/app/<slug>.png`
Expected: a mismatch % printed and a row added to `output/report.html`. Open the report; eyeball reference│actual│diff. Note any layout/type/color drift in the task's commit message.

- [ ] **Step 4: Commit**

```bash
git add tools/design-fidelity/src/capture-m2-web.ts tools/design-fidelity/package.json
git commit -m "tools(fidelity): capture M2 web frames (inventory, ingredient form, account)"
```

### Task 4: M5 web frames (cook library empty, recipe detail)

**Files:**
- Create: `tools/design-fidelity/src/capture-m5-web.ts`
- Modify: `tools/design-fidelity/package.json` (add `capture:m5`)

**Interfaces:**
- Consumes: `capture-web-lib`; the mock AI generate path (to mint a recipe).
- Produces: `output/app/cook-tab-library--web-cook-empty.png`, `inventory-recipe-detail--web-recipe-detail.png`.

- [ ] **Step 1: Write the capture script**

- Empty state first (before any recipe exists): `signUp` → `/cook` → wait for the empty-library copy → `shoot(page, 'cook-tab-library--web-cook-empty')`.
- Then mint a recipe so detail has content: drive `/home` → fill "Ask in your own words" → "Cook this" → `/cook/generate` → wait for "Start cooking" (mock stream completes) → save/open the recipe → land on `/recipes/$recipeId`. (Read `apps/web/src/features` for the generate→save→detail flow; reuse the e2e `library.spec.ts` path as the reference for selectors.)
- `/recipes/$recipeId` → wait for the recipe title + the inline pantry block (frame ★-1) → `shoot(page, 'inventory-recipe-detail--web-recipe-detail')`.

- [ ] **Step 2: Run it**

Run: `pnpm --filter @pantry/design-fidelity capture:m5`
Expected: two PNGs at 2560×1722.

- [ ] **Step 3: Diff + eyeball** (as Task 3 Step 3) for both slugs.

- [ ] **Step 4: Commit**

```bash
git add tools/design-fidelity/src/capture-m5-web.ts tools/design-fidelity/package.json
git commit -m "tools(fidelity): capture M5 web frames (cook empty, recipe detail)"
```

### Task 5: M6 web frame (cook in-session, dark stove)

**Files:**
- Create: `tools/design-fidelity/src/capture-m6-web.ts`
- Modify: `tools/design-fidelity/package.json` (add `capture:m6`)

**Interfaces:**
- Consumes: `capture-web-lib` (`seedState` to start an active cook session) + the recipe minted as in Task 4.
- Produces: `output/app/cook-tab-at-the-stove--web-cook-in-session.png`.

- [ ] **Step 1: Write the capture script**

`signUp` → mint/seed one recipe (reuse Task 4's flow or `seedState`) → start a cook session (the "Start cooking" button on the recipe detail, or `cook.start` via `seedState`) → land on `/cook/session` → wait for the first step card to render in the dark-stove theme → `shoot(page, 'cook-tab-at-the-stove--web-cook-in-session')`. Confirm against `references/cook-tab-at-the-stove--web-cook-in-session.png` that the dark token theme is applied (background, not ad-hoc colors).

- [ ] **Step 2: Run** → `capture:m6` → one PNG at 2560×1722.
- [ ] **Step 3: Diff + eyeball** the slug.
- [ ] **Step 4: Commit**

```bash
git add tools/design-fidelity/src/capture-m6-web.ts tools/design-fidelity/package.json
git commit -m "tools(fidelity): capture M6 web frame (cook in-session)"
```

### Task 6: M7 web frames (chat entry, chat panel open)

**Files:**
- Create: `tools/design-fidelity/src/capture-m7-web.ts`
- Modify: `tools/design-fidelity/package.json` (add `capture:m7`)

**Interfaces:**
- Consumes: `capture-web-lib` + a minted recipe (Task 4 flow).
- Produces: `output/app/chat-against-a-recipe--web-1-entry-on-recipe.png`, `chat-against-a-recipe--web-2-chat-panel-open.png`.

- [ ] **Step 1: Write the capture script**

`signUp` → mint/open a recipe → `/recipes/$recipeId`:
- Entry state: wait for the chat entry chips to be visible (recipe stays live, panel closed) → `shoot(page, 'chat-against-a-recipe--web-1-entry-on-recipe')`.
- Panel open: navigate to `/recipes/$recipeId?chat` (the co-pilot panel query the M7 work added) → wait for the chat composer → `shoot(page, 'chat-against-a-recipe--web-2-chat-panel-open')`.

Confirm chip/heading copy against the recipe-chat `strings.ts`.

- [ ] **Step 2: Run** → `capture:m7` → two PNGs.
- [ ] **Step 3: Diff + eyeball** both slugs.
- [ ] **Step 4: Commit**

```bash
git add tools/design-fidelity/src/capture-m7-web.ts tools/design-fidelity/package.json
git commit -m "tools(fidelity): capture M7 web frames (recipe chat)"
```

### Task 7: M8 web frames (paywalls, limit-hit, trial-ending, settings pro)

**Files:**
- Create: `tools/design-fidelity/src/capture-m8-web.ts`
- Modify: `tools/design-fidelity/package.json` (add `capture:m8`)

**Interfaces:**
- Consumes: `capture-web-lib` (`seedState` for subscription tier + exhausted quota).
- Produces: `output/app/paywall-variation-a--web-paywall-onboarding.png`, `paywall-variation-b--web-paywall-plan-compare.png`, `contextual-paywalls--web-limit-hit-modal.png`, `free-trial-lifecycle--web-trial-ending-page.png`, `subscription-in-settings--web-settings-subscription-pro-active.png`.

- [ ] **Step 1: Write the capture script**

- Paywall A: `/upgrade` in the editorial variant → wait for hero copy → `shoot(…'paywall-variation-a--web-paywall-onboarding')`. (The M8 work has A/B — find how the variant is selected: route query, prop, or A/B flag. Force variant A.)
- Paywall B: same route, plan-compare variant → `shoot(…'paywall-variation-b--web-paywall-plan-compare')`.
- Limit-hit modal: `seedState` to exhaust the weekly recipe quota, then attempt a generation from `/home` so the limit-hit modal opens → wait for the modal → `shoot(…'contextual-paywalls--web-limit-hit-modal')`.
- Trial-ending: `seedState` tier=trial near expiry → `/trial` → `shoot(…'free-trial-lifecycle--web-trial-ending-page')`.
- Settings pro-active: `seedState` tier=pro → `/settings` → wait for the active-subscription rows → `shoot(…'subscription-in-settings--web-settings-subscription-pro-active')`.

Reuse the `paywall.spec.ts` e2e selectors and the subscription `strings.ts` for exact copy.

- [ ] **Step 2: Run** → `capture:m8` → five PNGs at 2560×1722.
- [ ] **Step 3: Diff + eyeball** all five slugs.
- [ ] **Step 4: Commit**

```bash
git add tools/design-fidelity/src/capture-m8-web.ts tools/design-fidelity/package.json
git commit -m "tools(fidelity): capture M8 web frames (paywalls, settings)"
```

### Task 8: Full web sweep + report

**Files:**
- Modify: `tools/design-fidelity/package.json` (add `"capture:web:all"` running login + m2 + m4 + m5 + m6 + m7 + m8 in sequence).

**Interfaces:**
- Consumes: all Phase A captures.
- Produces: `output/report.html` + `output/sweep.json` with **0 of 18 web frames missing**.

- [ ] **Step 1: Add the aggregate script + run it clean**

Add `capture:web:all`, then run capture:app-web + capture:m2/m4/m5/m6/m7/m8 against the Task 1 stack.

- [ ] **Step 2: Run the sweep**

Run: `pnpm --filter @pantry/design-fidelity sweep`
Expected: console reports `captured` count ≥ 18 web frames; **no web slug in the missing list**. (Mobile frames will still show missing/high — handled in Phase B/C.)

- [ ] **Step 3: Produce the agent's first-pass assessment**

Open `output/report.html`. For each web frame, read the actual PNG and compare to the reference; write a one-line verdict (match / drift:<what>) per slug into a scratch note. This is input for the maintainer, **not** an approval.

- [ ] **Step 4: Commit captures + report**

```bash
git add tools/design-fidelity/output/app tools/design-fidelity/output/report.html tools/design-fidelity/output/sweep.json tools/design-fidelity/package.json
git commit -m "tools(fidelity): full web frame sweep + report"
```

---

## Phase B — Mobile tooling fixes (autonomous)

### Task 9: Normalize differently-sized captures before diffing

**Files:**
- Modify: `tools/design-fidelity/src/sweep.ts`
- Modify: `tools/design-fidelity/src/capture-app-mobile.ts`
- Test: `tools/design-fidelity/src/sweep.normalize.test.ts` (Create)

**Interfaces:**
- Consumes: nothing new.
- Produces: `normalizeForDiff(ref: PNG, act: PNG): { ref: PNG; act: PNG; w: number; h: number }` exported from a small `normalize.ts`, used by `sweep.ts`. Mobile actuals captured at reference width.

- [ ] **Step 1: Write the failing test**

```ts
// sweep.normalize.test.ts
import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { normalizeForDiff } from './normalize';

describe('normalizeForDiff', () => {
  it('scales a larger actual down to the reference width before diffing', () => {
    const ref = new PNG({ width: 780, height: 1602 });
    const act = new PNG({ width: 1178, height: 2556 }); // native iPhone screenshot
    const out = normalizeForDiff(ref, act);
    expect(out.w).toBe(780);              // compare at reference width
    expect(out.act.width).toBe(780);      // actual was resized, not just padded
    expect(out.h).toBe(Math.max(1602, out.act.height)); // height padded to tallest
  });

  it('is a no-op when dimensions already match (web frames)', () => {
    const ref = new PNG({ width: 2560, height: 1722 });
    const act = new PNG({ width: 2560, height: 1722 });
    const out = normalizeForDiff(ref, act);
    expect(out.w).toBe(2560);
    expect(out.h).toBe(1722);
  });
});
```

- [ ] **Step 2: Run it, watch it fail**

Run: `pnpm --filter @pantry/design-fidelity exec vitest run src/sweep.normalize.test.ts` (add a `test` script + vitest devDep if the tool package lacks one; otherwise run via the workspace runner).
Expected: FAIL — `normalize` module not found.

- [ ] **Step 3: Implement `normalize.ts`**

Implement `normalizeForDiff`: if `ref.width === act.width`, pad both to max height and return (web no-op covers equal dims). Otherwise scale `act` to `ref.width` preserving aspect with a nearest/bilinear resample over the pngjs buffer (no native dep), then pad both to `max(ref.height, scaledAct.height)`. Return `{ ref: paddedRef, act: paddedAct, w: ref.width, h }`. **Preserve aspect — do not stretch to exact reference height** (the board's stylized 390×800 device is a different aspect than a real iPhone; stretching would inject false drift).

- [ ] **Step 4: Run the test green**

Run: `pnpm --filter @pantry/design-fidelity exec vitest run src/sweep.normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire `normalizeForDiff` into `sweep.ts`**

Replace the inline `pad(...)`/`Math.max` block (`sweep.ts:76-81`) with a `normalizeForDiff(ref, act)` call; feed its `w/h/ref/act` into `pixelmatch`. Keep the missing-capture branch unchanged.

- [ ] **Step 6: Resize the simulator screenshot at capture time**

In `capture-app-mobile.ts`, after `simctl io booted screenshot`, resize to the reference width with `sips` (macOS-native, no dep). For each slug, read the reference width from the PNG header and run:
`sips --resampleWidth <refWidth> <APP_DIR><slug>.png` (in place). This keeps the committed actuals review-friendly and makes the tripwire meaningful.

- [ ] **Step 7: Re-run the sweep against the existing (stale) mobile captures**

Run: `pnpm --filter @pantry/design-fidelity sweep`
Expected: the 7 already-captured mobile frames drop from ~60% to a plausible review range (single/low-double digits) — proving the scale artifact is gone. (They still need a fresh capture in Phase C; this only validates the math.)

- [ ] **Step 8: Commit**

```bash
git add tools/design-fidelity/src/normalize.ts tools/design-fidelity/src/sweep.normalize.test.ts tools/design-fidelity/src/sweep.ts tools/design-fidelity/src/capture-app-mobile.ts tools/design-fidelity/package.json
git commit -m "tools(fidelity): normalize capture sizes before diff (fixes mobile scale artifact)"
```

### Task 10: Expand mobile deep-link coverage; document the gaps

**Files:**
- Modify: `tools/design-fidelity/src/capture-app-mobile.ts` (`ROUTES`)
- Modify: `docs/checklists/m9-fidelity-sweep.md` (annotate which mobile frames are reachable vs need an app-side dev deep link)

**Interfaces:**
- Consumes: the mobile route/deep-link scheme.
- Produces: a `ROUTES` map covering every mobile frame that has an existing deep link, and an explicit list of frames that need a new app-side dev-only deep link (sheets, scan/generate beats, selecting/resume states).

- [ ] **Step 1: Inventory mobile deep links**

Search the mobile app for the linking config: `rg -n "pantrycopilot://|scheme|Linking|expo-router" apps/mobile -l` and read the route/deep-link registrations. Map each mobile reference slug to a deep link where one exists.

- [ ] **Step 2: Extend `ROUTES`**

Add every newly-confirmed mapping (e.g. settings tiers, paywall B, recipe detail, cook resume) to `ROUTES`. For frames whose state can't be reached by a URL alone (open sheets, mid-scan/mid-generate, home-selecting), **do not invent UI** — leave them unmapped (the script already logs `SKIP … no deep link mapped`).

- [ ] **Step 3: Annotate the checklist**

In `m9-fidelity-sweep.md`, tag each mobile frame `[deep-link]` (capturable now) or `[needs dev deep-link]` (follow-up in the mobile app, out of scope for this plan). This tells the maintainer exactly which mobile frames the Phase C run will produce.

- [ ] **Step 4: Commit**

```bash
git add tools/design-fidelity/src/capture-app-mobile.ts docs/checklists/m9-fidelity-sweep.md
git commit -m "tools(fidelity): expand mobile deep-link map; mark unreachable frames"
```

---

## Phase C — Mobile capture (maintainer / hardware step)

### Task 11: Document and run the mobile capture procedure

**Files:**
- Modify: `docs/launch-readiness.md` (tighten the mobile fidelity procedure to reference the normalization fix).

**Interfaces:**
- Consumes: a booted iOS simulator + the Expo app (Expo Go is fine — deep links work) + Tasks 9–10.
- Produces: `output/app/<mobile-slug>.png` for every `[deep-link]` frame, resized to reference width.

> **This task needs a Mac with a booted iOS simulator and the running Expo app.** The agent can *attempt* it on request (boot a sim + `expo start` via Bash) but cannot guarantee determinism; the default owner is the maintainer. `[needs dev deep-link]` frames are deferred until the mobile app exposes those dev links.

- [ ] **Step 1: Boot + freeze the simulator**

```bash
xcrun simctl boot "iPhone 15" 2>/dev/null || true
xcrun simctl status_bar booted override --time "9:41" \
  --batteryLevel 100 --batteryState charged --cellularBars 4 --wifiBars 3
```

- [ ] **Step 2: Run the Expo app on it**

Run: `pnpm --filter @pantry/mobile start` then press `i` (or `xcrun simctl openurl` the dev URL). Confirm the app loads to Home.

- [ ] **Step 3: Capture**

Run: `pnpm --filter @pantry/design-fidelity capture:mobile`
Expected: one resized PNG per `[deep-link]` slug; `SKIP` lines for `[needs dev deep-link]` frames.

- [ ] **Step 4: Sweep + report**

Run: `pnpm --filter @pantry/design-fidelity sweep`
Expected: `output/report.html` now shows captured mobile frames at a reviewable mismatch %; only `[needs dev deep-link]` frames remain missing.

- [ ] **Step 5: Commit captures**

```bash
git add tools/design-fidelity/output/app docs/launch-readiness.md
git commit -m "tools(fidelity): capture mobile frames via simulator"
```

---

## Phase D — Sign-off & roadmap update

### Task 12: Record approvals and flip milestone states

**Files:**
- Modify: `docs/checklists/m2-pantry.md`, `m5-library.md`, `m6-cook-sessions.md`, `m7-recipe-chat.md`, `m8-monetization.md`, `m9-fidelity-sweep.md`
- Modify: `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md`

**Interfaces:**
- Consumes: the maintainer's review of `output/report.html`.
- Produces: signed checklists + an updated Status table.

- [ ] **Step 1: Present the report for review**

Share `tools/design-fidelity/output/report.html` (web frames complete; mobile per Phase C) plus the agent's first-pass verdicts. **The maintainer approves or rejects each frame** — this is the gate; the agent does not self-approve.

- [ ] **Step 2: Record per-frame approvals**

For each approved frame, fill `approved by <name> on <date>` and the current mismatch % in the relevant `docs/checklists/m*.md` and in `m9-fidelity-sweep.md`. For rejected frames, log the discrepancy and open a fix (out of scope for this plan — it's an app change, not a capture change).

- [ ] **Step 3: Flip Status states (only fully-approved milestones)**

In the roadmap Status table, change `impl complete · fidelity review pending` → `done` for each milestone whose frames are all approved. Leave any milestone with an outstanding mobile `[needs dev deep-link]` frame as pending and note what remains.

- [ ] **Step 4: Commit**

```bash
git add docs/checklists docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md
git commit -m "docs(fidelity): record frame approvals; advance milestone status"
```

---

## Self-review notes

- **Coverage:** every uncaptured web frame in `m9-fidelity-sweep.md` is assigned to a Task 3–7 capture; Task 8 verifies 0 web frames missing. Mobile is split into the normalization fix (Task 9, the actual blocker on meaningful diffs), deep-link expansion (Task 10), and the hardware capture (Task 11). Sign-off + roadmap in Task 12.
- **Honesty:** web is autonomous; mobile screenshotting is explicitly a hardware/maintainer step; final approval is always the maintainer's. Stated up front in "What is and isn't autonomous."
- **No invented UI:** where the board lacks a deep-linkable state, frames stay unmapped/`SKIP` rather than faking a state (per the design bible's primitives-only rule).
- **Open dependency:** Tasks 4–7 assume the generate→save→detail and paywall A/B flows are reachable via existing routes/e2e selectors; Step 1 of each task confirms selectors against the feature's `strings.ts`/e2e spec before screenshotting, so a renamed control surfaces as a fast failure rather than a silent wrong capture.
