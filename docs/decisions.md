# Decisions log

Board-silent composition calls and scope deviations, newest first.

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
