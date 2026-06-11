# Decisions log

Board-silent composition calls and scope deviations, newest first.

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
