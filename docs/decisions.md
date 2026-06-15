# Decisions log

Board-silent composition calls and scope deviations, newest first.

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
