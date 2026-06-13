# M1 — Auth + app shells: fidelity checklist

| Frame | Reference | Status | Pixelmatch % (tripwire baseline) |
| --- | --- | --- | --- |
| Web · Login | references/marketing-auth--web-login.png | approved 2026-06-12 | 0.27% |
| Mobile · Login | references/marketing-auth--mobile-login.png | approved 2026-06-13 | n/a (size mismatch — see decisions.md) |

Pinned simulator: iPhone 16 Pro, iOS 18.5 (Expo Go). Reference frame is
780×1602 (390×801 @2x); device captures at 1206×2622, so pixelmatch is not the
mobile gate — approval is human side-by-side (see decisions.md).

Web baseline notes: remaining diff is apostrophe glyph choice (typographic in
strings.ts vs the board's straight quotes — sanctioned in the plan), one
anti-aliased lede line, and a ~1px weirdness-track offset. Captured via
`pnpm -C tools/design-fidelity capture:web` against dev servers.

Mobile capture notes: captured live from Expo Go on the pinned simulator to
`output/app/marketing-auth--mobile-login.png`, fixture content set to
`mara@home.kitchen` + a 12-char password to mirror the reference's populated
state; status bar overridden (9:41, full bars, charged). Side-by-side rendered
via `pnpm -C tools/design-fidelity compare references/marketing-auth--mobile-login.png output/app/marketing-auth--mobile-login.png`
(report.html); the 65.6% pixelmatch figure is meaningless here — the 390×801
board frame and the 393×852 device screen differ in size/bezel, which is why
this frame's gate is human side-by-side, not pixelmatch. Two known
environmental deltas vs the reference, neither a fidelity defect: (1) Expo Go's
floating dev-menu gear in the top-right margin (absent in a standalone build);
(2) a blinking text caret in the email field. Layout, spacing, Newsreader
display heading + italic accent, Inter body, accent-green primary button,
field/icon styling, divider, and footer all match the board.

Maestro: `e2e/mobile/sign-in.yaml` (canonical flow targets the
`com.pantrycopilot.app` dev build, not produced in M1). Verified locally
2026-06-13 against Expo Go via an adapted copy (appId `host.exp.Exponent`,
`eraseText` before input since the login fixture pre-populates the fields):
all steps COMPLETED through `assertVisible: 'Home'` — login → credentials →
Sign in → authenticated tabs, confirmed by a new session row and the iOS Save
Password prompt. CI execution remains deferred.
