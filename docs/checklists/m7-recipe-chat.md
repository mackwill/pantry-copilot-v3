# M7 — Chat against a recipe: fidelity checklist

The 4 §✦ board reference frames drive the gate. All automated gates —
contracts + `@pantry/utils` reducer + AI tweak-emitter/orchestrator + API tweak
integration + web component/hook + mobile hook tests, lint, typecheck,
`pnpm -r build`, the web Playwright happy path (`e2e/web/specs/recipe-chat.spec.ts`)
— are **green**. Screenshot capture + visual approval is **pending review** (web
needs the full stack; mobile needs the pinned simulator + frozen clock),
consistent with the M2–M6 fidelity-review-pending precedent.

## The 4 frames to approve

| # | Frame (board) | Capture surface | Status |
| - | ------------- | --------------- | ------ |
| 1 | Web · Entry on recipe | `/recipes/:id` (inverse "Tweak this recipe" + accent-soft suggestion strip) | pending review |
| 2 | Web · Chat panel open | `/recipes/:id?chat=true` (live doc left + co-pilot panel right, after one tweak) | pending review |
| 3 | Mobile · Entry on recipe | recipe detail (accent-soft hint card + floating "Tweak this recipe" FAB) | pending review |
| 4 | Mobile · Chat sheet open | recipe detail → chat sheet (ApplyBar header + thread + composer, 78%) | pending review |

## Logged divergences (see `docs/decisions.md` 2026-06-16)

- **Auto-apply, no preview/apply gate.** The board shows applied turns + a revert
  control; we stream the `updatedRecipe` straight to the live doc each turn. The
  "apply bar" reading is the version pill (`v3 · 2 tweaks`) + Revert, not a
  staged diff.
- **The streamed summary appears whole, not char-by-char.** It lives inside the
  `emit_tweak` tool JSON, so the tolerant parser surfaces it once its closing
  quote lands (then the recipe body streams). Reducer still concatenates, so a
  future delta-capable parser needs no client change.
- **Change chips ride in on `tweak_done`** (one mechanism), not a separate
  `tweak_change` event.
- **Web entry/chat are distinct layouts** keyed off `?chat=true` (entry = the
  normal detail grid; chat = `1fr 420px` doc + panel). Mobile keeps the detail
  mounted and overlays the sheet, with the doc behind reflecting the live recipe.
- **Mobile sheet header (ApplyBar) scrolls with the thread** rather than pinning —
  the canonical `BottomSheet` body is a single ScrollView; the composer is the
  sticky footer.

## Capture instructions

**Web (frames 1–2):** run api (4000) + ai (4001, `DEFAULT_AI_PROVIDER=mock`) + web
(3000). Sign up, generate one recipe, open it (frame 1), click **Tweak this
recipe**, send one tweak and wait for `v2 · 1 tweak` (frame 2). Capture at
1280×861@2x via the `tools/design-fidelity` web flow; compare with `src/compare.ts`
(pixelmatch, threshold 0.1). Mismatch % reflects mock-recipe content, not layout.

**Mobile (frames 3–4):** pinned simulator with status-bar override + frozen clock
(per M1–M6). Seed/generate a recipe, open the detail (frame 3 — hint card + FAB),
tap the FAB to open the sheet (frame 4). `xcrun simctl io screenshot` each and
compare against the references.
