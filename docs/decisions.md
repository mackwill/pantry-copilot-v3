# Decisions log

Board-silent composition calls and scope deviations, newest first.

## 2026-06-16 — M6 cook sessions + consume flow

Settled in code per the M6 plan (`docs/superpowers/plans/2026-06-16-m6-cook-sessions-consume-flow.md`).
Design doc: `docs/design/cook-sessions.md`.

- **(A) Structured recipe steps replace plain strings.** `AIRecipe.steps` is now
  `RecipeStep[]` (`{ text, label?, durationMinutes? }`). The read path tolerates legacy
  `string[]` (coerced to `{ text }` via a `z.union(...).pipe(...)`) so already-persisted M4
  recipes still parse — no data backfill. The AI prompt + `emit_recipe` tool schema instruct
  the model to emit a short verb `label` and a `durationMinutes` timer for active-wait steps.
- **(B) One active session per user.** `cook.start` abandons any existing `active` session
  before creating the new one; resume reads the user's `active` session (`cook.getActive`).
- **(C) Timers are client-side, never persisted.** Only `currentStepIndex` + `startedAt`
  persist; the countdown ring is seeded from the step's `durationMinutes` and runs in
  `useCookSession`. Avoids per-second DB writes; a killed app resumes to the right step.
- **(D) Consume is one transaction** (`cook.consume`): per item deduct via `quantity.deduct`,
  write an `inventory_events` row (new kind `'consumed'`), reduce stock or remove used-up
  items, and mark the session `completed` — atomically.
- **(E) Context pills are UI affordances.** "as recipe / used more / used less / Used it all"
  set the numeric `quantityUsed` (+ a `finished` flag); the contract carries only the resolved
  numbers.
- **(F) Dark stove theme via token overrides — but only mobile is dark.** Per the board, the
  §03.5 **mobile** in-session is the dark "stove" surface; the **web** in-session is light with
  an inverse "Cooking now" banner ("dark theme for the stove" is the mobile frame note; the web
  frame is "large step + simmer timer"). So: a canonical `.theme-stove` scope in `tokens.css`
  is the single source the RN `tokens.stove` group is **generated** from (generator extended to
  parse the scope); web composes the banner from existing inverse tokens + a new
  `--accent-strong` (#A4C46B). No ad-hoc hex in components.
- **(G) BottomSheet slide-in fix** ports v2's `Animated.parallel` pattern (scrim fade + sheet
  `translateY`) with a `mounted` lifecycle so the slide-out completes before unmount.

Smaller calls logged for completeness:

- **`quantity.deduct(have, used)` drops the plan's speculative `unit` param.** Pantry quantity
  is `numeric(10,2)` and an item carries a single unit, so the deduction is unit-agnostic at a
  fixed 2-decimal precision; an unused param would only trip `no-unused-vars`.
- **`inventory_events.item_id` made nullable + `ON DELETE SET NULL` (migration 0006).** A
  `consumed` event must outlive a fully-used item that's removed; the prior `cascade` would have
  erased the audit row. Existing `added`/`edited` events always set `item_id`, so unaffected.
- **Consume contract reuses `pantryUnitSchema`**, not a separate `unitSchema`.
- **Web "Finish" completes the session with no deductions** (`cook.consume` with empty items);
  the editable consume flow is mobile-only per the board (§★ frames are all mobile).
- **Mobile in-session "exit" (X) leaves the session active** (resumable) rather than abandoning;
  "Not now" on the end-of-cook ask abandons it. Resume is the headline mobile affordance.
- **"Using in this step" shows the full recipe ingredient list** — the board's per-step
  ingredient subset has no backing data (steps don't map to ingredients); composed from the
  flat ingredient list. The warning chip surfaces the recipe's first `caveat` when present.
- **Consume↔pantry matching is by name** (case-insensitive contains); unmatched recipe
  ingredients render in the "missing" box. Stepper increments: 1 for count units, 0.25 for
  measured units.
- **e2e race fix (not M6-specific):** the shared `generateRecipe` web helper now waits for the
  result actions (recipe persisted) before navigating — leaving `/cook/generate` mid-stream
  unsubscribes the tRPC subscription and aborts the job. The larger structured-step payload
  exposed this latent race.

## 2026-06-16 — M5 scope decisions + divergences

Settled in code per the M5 plan (`docs/superpowers/plans/2026-06-15-m5-recipe-library-detail.md`):

- **(A) Cook becomes the library; the generation prompt relocates.** The board
  (home-cook-v2 comment) makes the Cook tab the recipes library and keeps the new-ask
  prompt on Home. Per platform:
  - **Web:** generation Home stays at `/cook` (activeId `cook`, unchanged from M4). The
    **library** is hosted under the existing **Recipes** sidebar item — `/recipes`
    (list/empty) + `/recipes/$recipeId` (detail). The board's "Web · Cook · empty" frame
    is matched at the `/recipes` empty state. **Divergence:** the board highlights the
    *Cook* nav item on this frame; v3 highlights *Recipes*, because v3's sidebar carries a
    dedicated Recipes item the mobile tab-bar lacks. Logged; noted in the fidelity checklist.
  - **Mobile:** the tab-bar has no Recipes slot, so the library lives on the **Cook tab**
    (`(tabs)/cook.tsx`) and the generation Home **moves to the Home tab** (`(tabs)/index.tsx`,
    previously a placeholder). The prompt stays reachable from Cook via the **`NewAskSheet`**
    ("New" button / "Cook something new" row → the unchanged M4 `/generate` flow). The M4
    "Mobile · Home" composition is unchanged — only its host tab changed; `e2e/mobile/generation.yaml`
    now taps **Home** instead of Cook.
- **(B) Favorites are a join table, not a recipe column.** `recipe_favorites (user_id,
  recipe_id)` (composite PK, cascading FKs) makes (un)favorite idempotent and per-user.
  `recipes.list`/`byId` left-join it into a `favorited` boolean. The M4 `recipeSchema`
  (persisted DTO, also used by the `done` re-emit) is **left untouched**; detail adds a
  separate `recipeDetailSchema = recipeSchema.extend({ favorited })`.
- **(C) Recent / "recently cooked" / counts are session-derived → deferred to M6.** The
  board's Cook frames show session statuses ("finished · saved", "cooked 7×", "stopped at
  step 2") with no M5 data source. For M5 these render from the persisted recipe rows as a
  **"Recently generated"** list (title + relative time + difficulty/weirdness), and the
  mobile counts line shows only **`{N} saved`** (cooked / want-to-try deferred). The board's
  Tonight/Cooked/Want-to-try filter pills render **disabled** until their M6 data exists.
  The `cook-tab-library--mobile-cook-with-resume` resume-banner frame is **out of M5 scope**
  (needs an active cook session; the `MobileCookTabEmpty` `resume` prop stays unset).
- **(D) "Start cooking" / "Share" / "Print" stay stubs; "Save"/bookmark is now live.** Per
  the M4 precedent (decision (g)), Start cooking navigates nowhere yet (wired in M6) and
  Share/Print are no-ops. The bookmark toggles a real favorite via `useFavorite`
  (optimistic flip + revert on error) — the one M4 stub M5 fulfils. The M4 Result card's
  Save + title now also drive favorites / link into the library (the recipe is already
  persisted with a real `recipeId`).
- **(E) Library list fields derive from the `data` jsonb; some detail meta are board
  placeholders.** `timeMinutes`/`difficulty`/`pantryItemsUsed` come from the stored
  `AIRecipe` body; `title`/`summary`/`weirdness`/`createdAt` from the row columns (no
  `recipes` schema change). The detail meta strip's **serves / cost / cal-per-serve** cells
  have no per-recipe data in M5 and render **board-fixture placeholders** (`2`, `$3.40`,
  `420`); only time and difficulty/effort are real. Noted in the fidelity checklist.
- **Icons added for board parity:** web `Printer` (detail Print stub); native `Bookmark`,
  `Share2`, `Timer`, `ArrowDownUp`, `Repeat` (the native set lacked them). Consistent with
  the M4 "add board icons as sections need them" pattern.

## 2026-06-15 — M4 scope decisions + web divergences

Settled with user (2026-06-14), recorded here as they shipped:

- **(a) tRPC-subscription client transport + raw SSE server-to-server.** Clients
  consume generation via the `recipes.generateStream` tRPC subscription over
  `httpSubscriptionLink` (browser `EventSource`); the API→AI hop is a separate raw
  SSE reader authenticated with the service token. One typed client, end-to-end.
- **(b) Recipes persisted in M4.** `recipes` + `recipe_generation_jobs` tables
  added now; on the stream's `done` event the API writes the recipe once
  (single-write guard) and re-emits `done` with the real persisted `recipeId`.
  M5 (library/favorites) reads these rows rather than introducing persistence.
- **(c) One recipe per request → Drafting diverges from the board.** The §04
  Drafting frame renders a single streaming recipe **without** the board's
  "Recipe 1 of 3" eyebrow / queued-recipe cards. Approved against the
  single-recipe variant in `docs/checklists/m4-generation.md`.
- **(d) Streaming states frozen via the scripted mock tape.** `mock.ts`
  `streamStructured` replays a committed deterministic event tape; CI orchestrator
  tests and the §04 fidelity captures run off it (no live AI in CI). A dev-only
  `MOCK_STREAM_DELAY_MS` (default 0) paces frames for manual smoke + freezing
  mid-stream fidelity snapshots without affecting determinism.
- **(e) Branch re-prompts are pure input transforms.** The four §02 tiles
  (Weirder / Faster / Vegetarian / Different angle) build a new `GenerationRequest`
  from the previous one via `buildBranchInput` (idempotent suffix append +
  weirdness bump) and re-run the same generate path — no new server endpoint.
- **(g) Result/Start actions stubbed until M5/M6.** "Start cooking" and "Save" on
  the §02 OneRecipeCard are no-op stubs (precedent set by M2/M3); cook sessions
  (M6) and library/favorites (M5) wire them later. Branch tiles are live.
- **Subscription cookie fix (`withCredentials`).** Driving the real web app
  surfaced that the browser `EventSource` is cross-origin (web :3000 ↔ api :4000)
  and omits the session cookie without `withCredentials`, so every subscription
  401'd. Fixed in `@pantry/api-client` (`eventSourceOptions.withCredentials`); the
  API's CORS already allows credentials for the configured origins. The curl-based
  E2 spike masked this by setting the `Cookie` header manually.
- **Web fidelity divergences** (intentional / scoped, in `m4-generation.md`):
  WebShell topbar chrome + sidebar LISTS + Home stats bar are out of M4's
  §01/§04/§02 content scope; "Recently saved" populates with M5; Drafting is the
  single-recipe variant per (c).

## 2026-06-15 — M4 mobile (Slice G/H) divergences

- **(h) RN SSE transport via `react-native-sse` + a typed adapter.** React
  Native's `fetch` can't stream, so the api-client subscription link (Slice E1)
  needs an injected `EventSource`. `apps/mobile/src/lib/rn-event-source.ts` adapts
  `react-native-sse` to tRPC's `EventSourceLike` contract
  (`CONNECTING/OPEN/CLOSED/readyState` + `addEventListener`/`close`). Two
  RN-specific concerns are handled there: the better-auth **session cookie is
  injected as a request header** (RN has no cookie jar; the browser relies on
  `withCredentials`), and the library's polling reconnect is **disabled**
  (`pollingInterval: 0`) so tRPC owns reconnection like the web link. Validated
  live on-device (Thinking → Drafting → Result streamed incrementally).
- **(i) Mobile generate route = a `(generate)` modal group mirroring `(scan)`.**
  `app/(generate)/generate.tsx` (a `fullScreenModal` Stack) hosts `GenerateScreen`,
  pushed from the cook Home with `{prompt, weirdness, items}` params. The M3 scan
  "See tonight's ideas" CTA now routes to the cook Home (where a prompt is entered).
- **(j) Native icon substitutions on §02.** The native icon set lacks the board's
  `timer`/`shuffle`/`utensils`/`bookmark` glyphs, so the 2×2 `BranchGrid` uses
  `Clock` (Faster) and `RefreshCw` (New angle), and `OneRecipeCardMobile` uses
  `ChefHat` (Start cooking) and `Heart` (Save). Labels/behaviour match the board.
- **Mobile fidelity method.** All 6 §01/§04/§02 frames were captured live from the
  **dev build** (`com.pantrycopilot.app`) on the pinned iPhone 15 / iOS 18.5
  simulator, driven by Maestro (openjdk) against the dev api/ai with the mock tape
  paced by `MOCK_STREAM_DELAY_MS`. Pixelmatch % is not the gate (390×800 board
  frame vs 1179×2556 device); the gate is human side-by-side. Approved in
  `m4-generation.md`. The Drafting frame is the single-recipe variant per (c).
- **Maestro e2e** `e2e/mobile/generation.yaml` (Home → prompt → Thinking → Drafting
  → Result → branch re-run) verified locally against the dev build; CI execution
  deferred (M1–M3 precedent — Maestro needs a simulator + JDK).

## 2026-06-15 — M4 SSE transport spike outcome (Slice E2)

The roadmap flagged Start/Nitro response buffering as the milestone's top risk and
mandated an early spike before building the streaming UI. Outcome: **incremental,
non-buffered delivery confirmed; no Start/Nitro mitigation was required**, because the
architecture keeps Start/Nitro out of the streaming path entirely.

- **Start/Nitro is not in the SSE path.** The web tRPC client (`@pantry/api-client`,
  `httpSubscriptionLink`) runs in the browser and opens a native `EventSource` directly
  to the API at `VITE_API_URL` (`http://localhost:4000/trpc`). The Vite/Start dev server
  (port 3000) only serves SPA assets; it does not proxy `/trpc`. So the original buffering
  risk — a Nitro server middleware reading/compressing the streamed body — cannot occur in
  this design. (`apps/web/src/lib/api.ts`, `apps/web/src/lib/env.ts`.)
- **Verified end-to-end against the real API.** Drove `recipes.generateStream` through the
  running stack (mock provider) via a browser-equivalent SSE `GET`
  (`Accept: text/event-stream`, superjson-wrapped `input`, real better-auth session cookie
  — exactly the request `EventSource` issues). Frames arrived **one at a time, spaced
  ~120 ms apart over ~2.25 s** (not a single end-of-stream flush), terminating in
  `event: return`. The `done` frame carried a **real persisted `recipeId`** (uuid),
  confirming single-write-on-done through the full chain. The AI-service hop
  (`POST /recipes/generate/stream`) was independently confirmed to stream incrementally
  with the same spacing.
- **`MOCK_STREAM_DELAY_MS` (dev-only, default 0).** The committed mock tape emits frames
  instantly, which is correct for deterministic CI/fidelity but makes incremental delivery
  indistinguishable from a buffered flush. Added an env-gated per-frame delay
  (`services/ai/src/providers/mock.ts`) — **default 0** so CI and the fidelity gate stay
  instant and deterministic; set e.g. `120` for manual smoke. Frame order/content are
  unchanged, so orchestrator/tape tests are unaffected (61 AI tests green).
- **No throwaway spike route.** Because the transport was proven via the browser-equivalent
  `GET` against the real API and Start/Nitro is out of the path, a disposable dev spike
  page was unnecessary; the real consuming route lands in Slice F (`useGeneration` +
  `cook.generate.tsx`).

## 2026-06-14 — M3 (AI service v1 + camera scan)

Settled scope (agreed with user 2026-06-14):

- **Synchronous extract + persisted `image_scans` record, no polling.** `scan.extract` forwards
  the base64 image to the AI service and returns the extracted items in one tRPC round-trip,
  writing an `image_scans` row (`status` lifecycle + extracted JSON + provider/model/tokens) for
  audit. No job queue or polling endpoint — extraction is a few seconds; the board "Detecting"
  frame is the client-side waiting state. A separate `scan.confirm` mutation creates the selected
  pantry items in one transaction (reusing M2's insert + `inventory_events` `added` pattern).
- **Deferred blob storage / nullable `raw_image_url`.** The image travels base64 api→ai and the
  raw bytes are discarded after extraction. `image_scans.raw_image_url` stays nullable; no object
  store this milestone.
- **"Added" screen CTAs are stubs until M4.** Board frame 4 ("See tonight's ideas" / "3 new ideas
  ready") points at generation (M4). The CTAs render per board; "See tonight's ideas" is a no-op
  and "View pantry" navigates to the pantry tab. The ideas card count (3) is a static board value.
- **Camera fidelity over a reproduced fixture scene.** The iOS simulator has no camera; the board
  itself composites a *fake* fridge scene from CSS gradients + blurred colored rectangles (not a
  photo), so `ViewfinderStep`/`DetectingOverlay` reproduce that scene with RN `View`s. A bundled
  tiny sample JPEG (`SAMPLE_IMAGE_BASE64`) feeds the no-camera dev/CI intake (gallery button +
  Maestro), exercising the same `extract` path. The mock provider makes the Detecting/Review
  frames deterministic.
- **AI extraction reuses the M2 pantry enums + normalization coercion.** `ExtractedIngredient`
  reuses `pantryCategory`/`pantryLocation`/`pantryUnit`; every enum/number field is defensively
  `.catch(null)` so malformed model output never throws. The AI-service normalization pipeline
  alias-maps free-form model units/categories onto our enums (e.g. tub→jar, meat→protein) and
  dedupes by `normalizedName`, so AI output and storage never drift.
- **`AI_SERVICE_TOKEN` is optional on the api side, required on the ai side.** The AI service
  validates a ≥32-char token (fail-fast); the api treats it as optional (the AI service is the
  auth authority) so existing integration tests need no token. Dev/compose supply a shared token.
- **Scan is a full-screen modal flow, not a tab destination.** Route groups are URL-transparent,
  so the flow lives at `app/(scan)/scan.tsx` (URL `/scan`, `fullScreenModal` presentation,
  mirroring the `(modals)` pattern). The tab-bar "Scan" item intercepts its press to
  `router.push('/scan')` rather than navigating to a tab, so the dark viewfinder is not framed by
  the tab bar (per board §08, which shows no tab bar on the scan flow).
- **Added `Zap` + `Image` icons to the design-system registry.** Board §08 viewfinder chrome uses
  a flash (zap) and gallery (image) glyph; both were missing from the curated lucide set. Adding
  them is faithful to the board, not invented visual language.

## 2026-06-14 — M2 close-out (Pantry core, Slice J)

Settled scope (agreed with user 2026-06-13):

- **Account screens are display-only shells (web §06 + mobile §10).** Avatar initials, name,
  and email wire to the real session user (web `api.user.me`; mobile `authClient.useSession()`).
  Every preference/profile/stat/subscription row renders static board content. Sign out is
  functional on both. A `user_preferences` table and editable preferences are deferred to a
  later milestone.
- **Mobile tap-to-cook tray = full selection, stubbed Cook action.** The tap-to-select tray and
  `useCookSelection` state are implemented and tested; the `Cook` button renders per board but
  its press is a no-op placeholder until M4 wires generation.
- **Recipe detail frame excluded from M2** (roadmap assigns it to M5). M2 shipped 10 frames
  (3 web + 7 mobile).

Inventory event log:

- `inventory_events` records `added`/`edited` rows inside the same transaction as the item
  mutation. The `removed` event is **intentionally not persisted**: `inventory_events.item_id`
  cascades on item delete, so a delete leaves no orphan event. If an audit trail outliving the
  item is ever needed, drop the FK cascade or null the FK. Out of scope for M2.

Board-silent composition / sanctioned deviations:

- **Ingredient form unified create + edit.** The board §06 frame is edit-only, but the Inventory
  "Add ingredient" button and the e2e add→edit→delete flow need a create path, so one web form
  serves both (`/pantry/new` create, `/pantry/$itemId` edit; "Remove" shows only when editing).
- **Web enum fields use native `<select>` + notes uses `<textarea>`** (styled to match `Input`):
  the board shows text inputs, but there is no Select primitive and enum values must be picked
  reliably. Standard HTML elements, not invented primitives.
- **Web Inventory `StatCard` composed from `Card` + tokens** (no StatCard primitive); stat deltas
  derived from real data (distinct locations; warning/danger item names).
- **Category filter uses the 7 contract categories** (Produce/Dairy/Pantry/Protein/Freezer/
  Drinks/Treats), not the board's v2 sample pills (which showed a "Spice" pill with no enum).
- **Inventory empty state** "Nothing here yet. Add your first ingredient." (board silent).
- **Native `Pill` primitive added** (`packages/design-system/src/native/Pill`) mirroring the web
  Pill tones — the native design system had none and the board uses status pills.
- **Native `Button` gained an optional `testID` prop** (Maestro/e2e targeting), spread-when-defined
  like the Icon/Input pattern.
- **Icons added to the curated sets:** web — `Upload`, `ScanLine`, `Filter`; native — `Milk`,
  `Wheat`, `Beef`, `Wine`, `Cookie`. Web ingredient back button uses `ChevronLeft` (no `ArrowLeft`
  in the web union); field leftIcons from the board (milk/tag/hash/calendar) were omitted rather
  than add icons unused elsewhere this milestone.
- **Mobile pantry header gained a `Plus` "add" entry** (→ `/add-ingredient` modal). Board §07
  shows only search + sliders; the add affordance is a usable entry point and a small, noted
  divergence in the fidelity checklist.
- **Picker sheets apply selection live** (`onSelect` fires on row tap); the footer "Use X" button
  just confirms/closes, and "Cancel" closes without an explicit revert (parent owns state).
- **Pure logic added to `@pantry/utils`:** `freshnessLabel` (board-style status text),
  `monthGrid(year, monthIndex)` + `addDays` (best-by calendar), all unit-tested.
- **`NotFoundError` added to the web `only-throw-error` lint allow-list** (alongside the existing
  `Redirect`) for the `notFound()` route loader throw — not a suppression comment.

Known mobile fidelity gaps (Input-primitive limits; polish deferred, not defects):

- Add/Edit ingredient **name renders in Inter ~14px**, not the board's Newsreader display size —
  the native `Input` exposes no text-style override.
- Edit **notes is single-line** (`Input`), board shows a multi-line block.
- Edit **freshness bar is a single accent fill**, board shows a green→amber gradient (not a token).

## 2026-06-13 — M1 close-out (Task 17)

- **Auth scope:** board-faithful email/password plus Google and Apple OAuth, both
  conditional on env credentials. Magic link is **plumbing only** (no UI); it doubles as the
  dev/e2e session bootstrap behind `AUTH_DEV_MAGIC_LINK`, which the env schema **rejects when
  `NODE_ENV=production`**. No dev auto-login (v2's anti-pattern).
- **Web sign-up is a composed, board-silent screen** (primitives only, mirroring the login
  left column + reusing `LoginHero`). **Mobile sign-up is deferred** — the board has no mobile
  sign-up frame, so account creation on mobile goes through OAuth/web for now; the mobile
  login footer ("New here? Create an account") is informational/non-interactive in M1.
- **`packages/contracts` deferred to M2** — M1 has no shared DTO; tRPC types flow via
  `AppRouter`. **`packages/api-client` is tRPC-client-only**; the Better Auth clients live
  per-app (`apps/web` browser client, `apps/mobile` expo client) since their transports differ
  (SSR cookie forwarding vs. SecureStore token + cookie-header injection).
- **Ephemeral-postgres test strategy:** a real postgres server (compose locally, GH Actions
  service container in CI) with `CREATE DATABASE pantry_test_<id>` per test file, drizzle
  `migrate()`, dropped in cleanup. No testcontainers. Migrations are **committed SQL only** —
  never `drizzle-kit push`. Because `pnpm test` now needs a running postgres, that requirement
  is documented in `CLAUDE.md`.
- **Cookies:** no explicit override — Better Auth's default `sameSite: lax` is correct for dev
  (localhost:3000 → :4000 is same-site); production cookie attributes will be env-driven at a
  later milestone. **v2's `stripSessionToken` was not adopted** — it would interfere with the
  `@better-auth/expo` client's token delivery (the mobile client reads the session token from
  the response and stores it in SecureStore), and the web client relies on the standard cookie.
- **Mobile fidelity gate is human side-by-side, not pixelmatch:** the board frame is 390×801
  and no device screen matches it (iPhone 16 Pro is 393×852), so pixelmatch is meaningless
  across the size/bezel difference. Pinned simulator (iPhone 16 Pro / iOS 18.5, Expo Go) is
  recorded in `docs/checklists/m1-auth.md`; the Maestro flow is authored and verified locally
  only (CI execution deferred). The committed `e2e/mobile/sign-in.yaml` targets the
  `com.pantrycopilot.app` dev build, which M1 does not produce — it was verified against Expo
  Go (`host.exp.Exponent`) via an adapted copy.
- **No iOS font fallback needed:** the design-system's woff2 variable fonts (Newsreader +
  italic, Inter, JetBrains Mono) load and render on iOS 18.5 via Expo `useFonts`; the planned
  TTF static-instance fallback was not required.
- **Web Containerfile deferred** until the web app actually deploys; M1 ships a Containerfile
  for `services/api` only.

## 2026-06-12 — M1 native batch-1 primitives (Task 8)

- **Native Pill deferred to M2:** the §00 login screens don't use it; it ships with the next
  native batch that does.
- **Chrome icon pinned locally:** the board's "Continue with Google" button uses lucide's
  `chrome` brand glyph, which lucide removed before 1.17.0 (the pinned version). The v0.460.0
  geometry (read from the v2 reference's lucide copy) is vendored as
  `src/{web,native}/Icon/Chrome.tsx` and registered in both icon maps under the original
  `Chrome` name, keeping screenshot fidelity with the board.
- **Native Eyebrow defaults `color` to `tokens.fgSubtle`** — the plan draft said `fgMuted`, but
  the web sibling's CSS (`--fg-subtle`) is the source of truth it mirrors.
- **Em-relative tracking mirrored as size-scaled points:** web Wordmark (-0.02em), Button
  labels and Input text (-0.005em), Field label (0.005em) become `fontSize * factor` on native
  (RN letterSpacing takes absolute units).

## 2026-06-11 — M0 close-out scope notes (Task 10)

- **RN primitive components were planned to move wholesale to M1**, but user direction
  mid-milestone pulled most of them forward (see the entry below). What still lands at M1:
  native NLPrompt, real-device/simulator rendering, and the native screenshot fidelity gate.
  M0 ships the generated native token mirror (`src/tokens/native.ts`) either way.
- **Containerfiles land with their services (M1+).** M0 compose
  (`infra/podman/compose.yaml`) runs postgres 17 only.
- **tokens.css body-background deviation:** the source file's `body { background: #E5E5DD }`
  is the mockup board canvas, not an app surface; the ported
  `packages/design-system/src/styles/tokens.css` uses `var(--bg)` instead (noted in a comment
  at the top of the file). This is the only divergence from the verbatim port.

## 2026-06-11 — M0 fidelity gate notes (Task 7)

- **NLPrompt vs HeroPrompt:** the board's Home screens use `HeroPrompt`
  (`screens/home-cook-v2.jsx`) — a larger, focus-ringed composition (32px display text,
  stacked weirdness row + chips row in the footer area). The `NLPrompt` primitive ports
  `components/nl-prompt.jsx` as the plan specifies. HeroPrompt is a screen-level
  composition to build at M1/M2 from primitives; do not retrofit it into NLPrompt.
- **Gallery BottomSheet is toggle-opened** (button or `?sheet` query param) rather than
  statically open: the sheet is a fixed full-viewport overlay, and leaving it open would
  scrim every other gallery section in captures.
- **Web BottomSheet drops the board's 54px container top padding** — that offset is the
  mockup's phone status bar, not sheet treatment; `max-height: 78%` governs height.
- Side-by-side review of gallery captures vs board frames (web shell chrome, tabs row,
  weirdness controls, NL prompt, sheet anatomy): no visible drift found.

## 2026-06-11 — Native (RN) primitives pulled forward from M1 into M0

User direction: implement the mobile counterparts of plan Task 5 instead of the web batch.
Shipped in `packages/design-system/src/native/`: `Icon`, `BottomSheet` + `SheetRow` (the one
canonical sheet), `MobileTabBar`, `WeirdnessSlider`, `WeirdnessControl`, plus `fonts` and the
shared weirdness vocabulary/gradient logic.

- **Testing:** components are written against `react-native` and tested on `react-native-web`
  under the package's existing Vitest/jsdom setup (alias + `.web.*` extension priority +
  `server.deps.inline` in `vitest.config.ts`). `react-native`/`react-native-svg` are optional
  peers; real rendering arrives with the Expo app at M1.
- **Visual fidelity is NOT yet verified:** the M0 harness captures web frames only. Native
  primitives get their screenshot gate at M1 via the simulator workflow.
- **Native NLPrompt deferred:** it composes Button/Pill/Eyebrow, which exist only as web
  primitives so far. It lands together with the native batch-1 ports.
- **Web Task 5 batch (WeirdnessSlider/Control, BottomSheet, NLPrompt, WebShell, Tabs) is still
  pending** and remains required for Tasks 6–7 (gallery + fidelity harness).
- `lucide-react-native` 1.17.0 is imported via its `/icons` subpath — the root barrel is broken
  (re-exports a `LucideProvider` that `context.mjs` never defines).
- Native `Icon` defaults `color` to `tokens.fg` (no CSS `currentColor` inheritance on native);
  containers pass explicit colors (e.g. tab bar active state).
- Sheet scrim drops the board's `backdrop-filter: blur(2px)` (not supported in RN without an
  extra native dependency); scrim color/opacity match the design.

## 2026-06-16 — M7 Chat against a recipe (§✦)

The board is **not silent** on the chat UX (recipe-chat-b shows applied turns + a
revert control), so we follow it; these are the interpretations and board-silent
transient states logged per the engineering standard.

- **Auto-apply each turn — no preview/apply gate.** The streamed `updatedRecipe`
  becomes the live recipe immediately; the board's "apply bar" reading is the
  version pill (`v3 · 2 tweaks`) + **Revert to original**, not a staged diff.
  Settled this session alongside revert-to-original-only and mutate-in-place
  versioning (one evolving `recipes` row: `version` counter + frozen
  `original_snapshot`), so the library shows a single recipe at its current
  version, not N rows.
- **Versioning is mutate-in-place.** `recipes.version` starts at 1 and bumps per
  applied tweak; `original_snapshot` is captured on the first tweak and restored
  (snapshot nulled, thread deleted) on revert. The append-only `recipe_tweaks`
  table is the audit log / chat thread — there is no separate job table (the
  `tweakStream` subscription's `finally` writes nothing).
- **Streaming summary appears whole, not char-by-char.** It lives inside the
  `emit_tweak` tool-call JSON, so the tolerant `parsePartialJson` surfaces it only
  once its closing quote lands; the tool schema orders `summary` first so it still
  arrives ahead of the recipe body. The wire keeps the concatenation model
  (`tweak_summary` deltas), so a future partial-string parser needs no client
  change.
- **Change chips ride in on `tweak_done`** (`response.changes`) — one mechanism,
  no separate `tweak_change` event.
- **Web entry vs chat are distinct layouts keyed on `?chat=true`** (entry = the
  normal detail grid with the inverse "Tweak this recipe" button + accent-soft
  suggestion strip; chat = `1fr 420px` live doc + docked panel). Search params are
  optional so existing links to `/recipes/:id` need no `search` prop.
- **Mobile overlays the sheet over the live detail.** The detail stays mounted and
  the doc behind reflects the live recipe (so a tweak/revert is visible on close);
  the `RecipeChatContainer` owns the hook. The sheet header (`ApplyBar`) scrolls
  with the thread rather than pinning — the canonical `BottomSheet` body is one
  ScrollView; the composer is the sticky footer.
- **The pure tweak reducer is shared in `@pantry/utils`** (`reduceTweakEvent` +
  `initialTweakState`/`beginTweakTurn` + `changeChipTone`), unit-tested once and
  imported by both `useRecipeChat` hooks.
- Icons added for the chat UI: web + native `Icon` registries gain `ArrowUp`,
  `Replace`, `RotateCcw`, `Users` (and web `Info`, `MoreHorizontal`).
- **Visual fidelity is NOT yet verified** — the 4 §✦ frames in
  `docs/checklists/m7-recipe-chat.md` are pending review (web full stack; mobile
  pinned simulator), per the M2–M6 precedent.
