# Decisions log

Board-silent composition calls and scope deviations, newest first.

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
