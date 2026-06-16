# M6 — Cook sessions + consume flow: fidelity checklist

The 6 M6 board reference frames (§03.5 in-session, §03 resume, §★ consume) drive the gate. All
automated gates — contracts/`@pantry/utils`/AI emitter + API cook integration/web component +
mobile hook & component tests, lint, typecheck, `pnpm -r build`, the web Playwright happy path
(`e2e/web/specs/cook.spec.ts`) — are **green**. Screenshot capture + visual approval is
**pending review** (web needs the full stack; mobile needs the pinned simulator + frozen clock),
consistent with the M2/M3/M5 fidelity-review-pending precedent.

## The 6 frames to approve

| # | Frame (board) | § | Capture surface | Status |
| - | ------------- | - | --------------- | ------ |
| 1 | Web · Cook · in session | 03.5 | `/cook/session` (active session, frozen clock) | pending review |
| 2 | Mobile · Cook · in session | 03.5 | `/session` dark stove screen (frozen clock) | pending review |
| 3 | Mobile · Cook · resume banner | 03 | Cook tab with an active session | pending review |
| 4 | Mobile · End of cook · the ask | ★ | `/session` last step → End-of-cook ask | pending review |
| 5 | Mobile · Consume sheet | ★ | End-of-cook ask → "Adjust what was used" | pending review |
| 6 | Mobile · Result · pantry inline | ★-1 | recipe detail "Using from your pantry" block | pending review |

## Logged divergences (decisions A–G + smaller calls — see `docs/decisions.md`)

- **Frame 1 (Web · in session) is light, not dark.** Per the board the "dark theme for the
  stove" note is on the **mobile** frame; the web frame is "large step + simmer timer". The web
  in-session is light with an inverse "Cooking now" banner; only mobile uses the dark
  `tokens.stove` surface. Decision F.
- **Timers are seeded from `durationMinutes`, not the board's exact `11:24`.** Frozen-clock
  fixtures pick a representative remaining time; the ring geometry/label match the board.
  Decision C.
- **"Using in this step" lists the full recipe ingredients** (no per-step ingredient data), and
  the warning chip shows the recipe's first caveat when present. The board's hard-coded 3-item
  subset + bespoke warning are fixtures.
- **Receipt / consume rows are real pantry matches.** Hints ("finishes it" / "{n} left"),
  "missing" entries, and quantities derive from the matched pantry items, so they differ from
  the board's fixed sample list.
- **Frame 6 may already exist from M4/M5** (the recipe-detail inline pantry block); re-verify it
  reads "Using from your pantry · N of M" and that Start cooking enters the session.

## Capture instructions

**Web (frame 1):** run api (4000) + ai (4001, `DEFAULT_AI_PROVIDER=mock`) + web (3000). Sign up,
generate one recipe, open it, **Start cooking** → `/cook/session`. Capture with a frozen clock at
1280×861@2x (extend the `tools/design-fidelity` web capture); compare with `src/compare.ts`
(pixelmatch, threshold 0.1). Mismatch % reflects mock-recipe content, not layout drift.

**Mobile (frames 2–6):** pinned simulator with status-bar override + frozen clock (per M1–M4).
Seed a recipe, Start cooking, then `xcrun simctl io screenshot` the dark stove screen, the Cook
tab resume banner, the End-of-cook ask (advance to the last step), the Consume sheet ("Adjust
what was used"), and the recipe-detail inline pantry block. Compare against the references.

## e2e

- **Web** `e2e/web/specs/cook.spec.ts`: signup → generate → open detail → **Start cooking** →
  in-session (banner + first step) → library resume banner → Resume → step to the end → **Finish**
  → back at `/recipes`, no resume banner. **Verified locally** (auto-boots ai+api+web; postgres
  via podman). Also restored `library.spec.ts` (the structured-step payload exposed a mid-stream
  navigation/abort race — `generateRecipe` now waits for the result actions).
- **Mobile** `e2e/mobile/cook.yaml` (Maestro): Cook tab → recipe card → detail → **Start
  cooking** → stove screen → next → exit → resume banner → Resume → step to finish → End-of-cook
  ask → Adjust → **Deduct from pantry** → back to library. **Local-only** (CI execution deferred
  per the M1–M5 precedent).

## BottomSheet slide-in (Slice 0)

The canonical mobile `BottomSheet` now slides up on open / down on close (Animated.parallel +
delayed unmount). Verify on device/sim that all 5 existing sheets (NewAskSheet, CategorySheet,
LocationSheet, BestBySheet, PantryPickSheet) animate and behave unchanged. Unit-tested for the
animated transform + delayed-unmount contract.
