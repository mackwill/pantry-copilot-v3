# M5 — Recipe library + detail: fidelity checklist

The 5 M5 board reference frames (§03 library, §05/§07 recipe detail) are captured
and committed under `tools/design-fidelity/references/`. All automated gates
(contracts/API integration/web + mobile unit tests, lint, typecheck, build) are
**green**. Screenshot capture + visual approval is **pending review** (web needs
the full stack running; mobile needs the pinned simulator), consistent with the
M2/M3 fidelity-review-pending precedent.

## The 5 frames to approve

| # | Frame | Reference (committed) | Capture surface | Status |
| - | ----- | --------------------- | --------------- | ------ |
| 1 | Web · Cook · empty | `cook-tab-library--web-cook-empty.png` | `/recipes` empty state | pending review |
| 2 | Web · Recipe detail | `inventory-recipe-detail--web-recipe-detail.png` | `/recipes/$id` (seeded) | pending review |
| 3 | Mobile · Cook · default | `cook-tab-library--mobile-cook-default.png` | Cook tab (seeded library) | pending review |
| 4 | Mobile · Cook · new-tapped | `cook-tab-library--mobile-cook-new-tapped.png` | Cook tab + `NewAskSheet` open | pending review |
| 5 | Mobile · Recipe detail | `mobile-pantry-recipe--recipe-detail.png` | `/(recipe)/[id]` (seeded) | pending review |

> `cook-tab-library--mobile-cook-with-resume.png` (resume banner) is **out of M5
> scope** — it needs an active cook session (M6). The `MobileCookTabEmpty` `resume`
> prop stays unset.

## Logged divergences (decisions A/C/E — see `docs/decisions.md`)

- **Frame 1 (Web · Cook · empty):** the board highlights the **Cook** sidebar item;
  v3 highlights **Recipes** (v3 hosts the library under its dedicated Recipes nav,
  which the board's mobile tab-bar lacks). Decision A.
- **Frames 1/3 (counts + recent):** the board's "Recent sessions" / "Recently
  cooked" lists and the `38 saved · 24 cooked · 6 want to try` counts are
  session-derived. M5 renders a **"Recently generated"** list from persisted
  recipes and shows only **`{N} saved`**; Tonight/Cooked/Want-to-try filters render
  disabled. Decision C.
- **Frames 2/5 (detail meta strip):** the **serves / cost / cal-per-serve** cells
  are board-fixture placeholders (no per-recipe data in M5); only time and
  difficulty/effort are real. Decision E.

## Capture instructions

**Web (frames 1–2):** run api (4000) + ai (4001, `DEFAULT_AI_PROVIDER=mock`) + web
(3000). Capture frame 1 at `/recipes` **before** seeding any recipe (genuine empty
state); generate one recipe via `/cook`, then capture the populated `/recipes` and
open `/recipes/$id` for frame 2. Playwright at 1280×861@2x (extend
`tools/design-fidelity/src/capture-m4-web.ts`); compare with `src/compare.ts`
(pixelmatch, threshold 0.1). Mismatch % reflects mock-recipe vs board content, not
layout drift.

**Mobile (frames 3–5):** pinned simulator with status-bar override + frozen clock
(per M1–M4). Seed a recipe (run the generate flow once), then `xcrun simctl io
screenshot` the Cook tab, the Cook tab with `NewAskSheet` open, and a recipe
detail. Compare against the references.

## e2e

- **Web** `e2e/web/specs/library.spec.ts`: signup → generate (mock provider) →
  `/recipes` shows the recipe → open detail → Save → reload → still `Saved` →
  appears under the Favorites filter. **Run with the web e2e harness** (deferred to
  the same CI lane as the other web specs).
- **Mobile** `e2e/mobile/library.yaml` (Maestro): Cook tab → recipe card → detail →
  bookmark → back → "New" → `NewAskSheet`. **Local-only** (CI execution deferred per
  the M1–M4 precedent).

## Relocated M4 frames (decision A) — re-verify

- **Mobile · Home** (`home--mobile-home*.png`): the M4 generation Home composition is
  unchanged; it now renders on the **Home tab** instead of the Cook tab. Quick visual
  re-check pending. `e2e/mobile/generation.yaml` updated to tap **Home**.
- **Web Home** at `/cook` is untouched by M5.
