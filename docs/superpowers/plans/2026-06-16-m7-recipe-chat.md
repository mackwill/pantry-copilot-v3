# M7 — Chat against a recipe (+ mobile weirdness-slider fix)

## Context

M7 is the next milestone in the Pantry CoPilot v3 rewrite (roadmap
`docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md`, board §✦). It adds a
**recipe co-pilot**: the user opens a saved recipe and asks for changes in
natural language ("less oil, more greens", "make it kid-friendly"). The AI
streams a one-sentence summary + a handful of tagged **change chips**, and the
recipe updates **live** to a new version (edited/added ingredients get an accent
dot). A single **Revert to original** restores the pre-tweak snapshot.

This is the last vertical-slice feature before monetization (M8). It reuses the
M4 streaming spine end-to-end (provider interface → SSE route → tRPC
subscription → client hook) rather than inventing new infrastructure.

**Settled decisions (this session):**
- **Auto-apply each turn** — no preview/apply gate; the streamed `updatedRecipe`
  becomes the live recipe immediately (matches the board, which shows applied
  turns + a revert control).
- **Revert to original only** — one snapshot restore, clears the tweak thread
  (matches board + v2). No per-turn undo.
- **Mutate-in-place versioning** — one evolving recipe row (`version` counter +
  frozen `originalSnapshot`), so the library shows a single recipe at "v3", not
  N rows. This matches the board's `v3 · 2 tweaks` pill.

**Side task (unrelated, user-flagged):** the mobile WeirdnessSlider stutters
while dragging. Fixed as Task 0 in its own commit before M7 work.

The board is **not silent** on the apply/revert UX (recipe-chat-b shows it), so
we follow it; the auto-apply-vs-apply-bar interpretation gets logged in
`docs/decisions.md`.

---

## Task 0 — Fix mobile weirdness-slider stutter (standalone commit)

**Problem:** `packages/design-system/src/native/WeirdnessSlider/SliderTrack.tsx`
calls `onChange` on every `onResponderMove`. The thumb's visual position is
`left: percent(value)` — driven by the **controlled `value` prop round-tripping
through parent state**. Every drag frame triggers a parent `setState` →
re-render of the whole sheet (e.g. `NewAskSheet`: TextInput + slider + chips) on
the JS thread → dropped frames → stutter. No `react-native-reanimated` /
`gesture-handler` in the workspace (confirmed in both package.json files); don't
add deps at a non-milestone boundary.

**Fix (no new deps):** decouple the thumb's visual position from the React
render cycle.
- Add an `Animated.Value` (the live touch fraction) inside `SliderTrack`. In
  `onResponderGrant`/`onResponderMove`, compute the value via the existing
  `valueFromTouch(x, trackWidthRef.current)` and drive the thumb imperatively:
  `thumbX.setValue(value)` — the thumb is an `Animated.View` whose `left` (or
  `translateX` against measured `trackWidthRef`) is interpolated from `thumbX`,
  so it glides with the finger regardless of how fast the parent re-renders.
- Still call `onChange(value)` each move so the label/value stay in sync, but the
  perceived smoothness no longer depends on that round-trip. When the controlled
  `value` prop changes from outside a drag (a11y increment, programmatic set),
  sync `thumbX` to it via an effect so the two never diverge.
- Keep all pure math in `weirdness.ts` (`valueFromTouch` is already unit-tested);
  the change is rendering-only.

**Verify:** existing design-system vitest suite green; manual drag on the mobile
NewAskSheet / generation sheet is smooth (capture via the mobile screenshot
tooling per `local-dev-runtime` memory). Commit separately from M7.

---

## M7 implementation (contracts → DB/API → AI → web → mobile → fidelity → e2e)

Follow `superpowers:test-driven-development` and `executing-plans`; commit per
slice. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` (postgres up via
`podman compose -f infra/podman/compose.yaml up -d`) before any "done" claim.

### 1. Contracts — `packages/contracts/src/recipes/`

Mirror the existing `events.ts` event-union pattern (the `eventBase` `{seq,t}`
envelope is the model).

- **`tweak.ts`** (new):
  - `recipeChangeTagSchema` = `z.enum(['change','add','remove','note'])`.
  - `recipeChangeSchema` = `{ tag, text (≤120) }` (the chip).
  - `recipeTweakResponseSchema` = `{ summary (≤280), changes: change[1..8], updatedRecipe: aiRecipeSchema }`.
  - `recipeTweakTurnSchema` (persisted turn DTO) = `{ id, turn, userMessage, summary, changes, createdAt }`.
- **`tweak-events.ts`** (new) — the SSE wire union (discriminated on `type`,
  each with `...eventBase`), reusing the M4 throttle/`done` conventions:
  - `tweak_summary` `{ text }` — growing summary prose (live typing).
  - `tweak_recipe_partial` `{ recipe: aiRecipePartial, complete }` — the
    updated recipe streaming in (reuse `aiRecipePartialSchema`).
  - `tweak_change` `{ change }` — change chips as they resolve (or include in
    the partial; keep one mechanism — recommend chips arrive on `tweak_done`).
  - `tweak_done` `{ response: recipeTweakResponse, recipeId, turn, version }`.
  - `error`, `aborted` — reuse the shapes from `events.ts`.
  - Export `recipeTweakEventSchema` discriminated union + inferred types.
- **`recipe.ts`** (edit): extend `recipeIngredientSchema` with optional
  `edited?: boolean` and `added?: boolean` (board renders the accent dot +
  "· edited" / "· added by tweak" labels). Keep backward compatible (optional).
- **`generation.ts`/new `tweak.ts`**: `recipeTweakRequestSchema` =
  `{ recipeId: uuid, prompt: string(1..) }`; `recipeRevertInputSchema` =
  `{ recipeId }`.
- Schema unit tests in `packages/contracts/.../*.test.ts` (parse valid/invalid,
  bounds on changes length, tag enum).

### 2. AI service — `services/ai/src/`

Reference (consult, never copy) v2 `services/ai/src/prompts/recipe-tweak.ts` and
`providers/tweak-stream.ts`.

- **`prompts/recipe-tweak.ts`** (new): `buildTweakSystemPrompt(original, priorTurns)`
  + user message builder. Instruct the model to make **minimal targeted edits**
  and call an `emit_tweak` tool **once** with `{summary, changes[1..8],
  updatedRecipe}`, flagging changed ingredients with `edited`/`added`.
- **`prompts/tweak-tool.ts`** (new): `TWEAK_EMIT_TOOL_SCHEMA` /
  `_DESCRIPTION`, mirroring `recipe-tool.ts` (JSON Schema = `recipeTweakResponseSchema`).
- **Provider interface** `providers/types.ts` (edit): add
  `streamTweak(req: AITweakRequest, signal): AsyncIterable<RecipeTweakEvent>`
  to `AIProvider`. Implement in `anthropic.ts`, `openai.ts`, `mock.ts`
  (deterministic tape for tests). `with-fallback.ts`: add the same
  before-first-yield fallback rule already used by `streamStructured`.
- **`pipelines/tweak-emitter.ts`** (new): adapt the `RecipeEmitter` +
  `parsePartialRecipe` pattern to extract the growing `summary` (live) and the
  `updatedRecipe` snapshot from the streaming tool-call JSON. Throttle like
  `recipe-emitter.ts`; `flush()` before `tweak_done`.
- **`providers/tweak-orchestrator.ts`** (new): the `runRecipeStream` analogue —
  wrap raw provider events into the `RecipeTweakEvent` wire union with monotonic
  `seq`/`t`, emit `aborted`/`error` on those paths.
- **Route** `routes/recipes.ts` (edit): `POST /recipes/tweak/stream` — same SSE
  framing, heartbeat, timeout, and `AI_SERVICE_TOKEN` guard as the generate
  route.
- AI unit tests with the mock provider (no live calls): summary grows, partial
  recipe resolves, `tweak_done` validates, abort/error paths.

### 3. API — `services/api/src/`

- **DB** `db/schema/recipes.ts` (edit): add `version: integer notNull default 1`
  and `originalSnapshot: jsonb<AIRecipe> | null` to `recipes`.
- **DB** `db/schema/recipe-tweaks.ts` (new) — append-only lineage (v2 model):
  `{ id, recipeId FK cascade, userId FK cascade, turn int, userMessage text,
  aiSummary text, changes jsonb, createdAt }`, index on `(recipeId, turn)`.
  Register in `db/schema/index.js`.
- **Migration**: `drizzle-kit generate` → `0007_*.sql` (next after `0006`).
- **AI stream client** `lib/ai-stream-client.ts` (edit): add
  `streamTweak(req, opts)` validating each frame against
  `recipeTweakEventSchema` — mirror `streamGeneration` exactly (headers, abort
  bridge, buffer split).
- **Router** `trpc/routers/recipes.ts` (edit), mirroring `generateStream`:
  - `tweakStream` subscription `{recipeId, prompt}`: load the recipe (own-row
    check); on **first** tweak capture `originalSnapshot = data`; build
    `AITweakRequest` from current `data` + prior `recipe_tweaks`; proxy
    `ctx.aiStream.streamTweak`. On `tweak_done`: in a transaction, bump
    `version`, write `data = updatedRecipe` (+ title/summary), insert the
    `recipe_tweaks` turn row; re-emit `tweak_done` with persisted `recipeId`,
    `turn`, `version`. `finally` mirrors the job-status pattern (no job table
    needed — tweaks are the audit log).
  - `tweaks` query `{recipeId}` → ordered turn list (for thread hydration).
  - `revert` mutation `{recipeId}`: restore `data = originalSnapshot`, reset
    `version = 1`, null the snapshot, delete that recipe's `recipe_tweaks`.
  - `byId`/`toDetail` (edit): include `version` + `tweakCount` so detail screens
    render the version pill without a second round-trip.
- API integration tests vs ephemeral postgres: tweak persists + bumps version +
  writes turn; revert restores snapshot + clears thread; ownership rejects other
  users.

### 4. Web — `apps/web/src/features/recipe-chat/` (new feature dir)

Route files stay composition-only; components ≤300 (target 200) lines; strings
in `strings.ts`; no JSX literals.

- Extend the recipe-detail route to a `?chat` open state (board: panel docks
  right, recipe stays live). Recommended: keep
  `routes/_authed/recipes.$recipeId.tsx` and render the chat panel from a new
  `recipe-chat` feature when `?chat` is set, so `recipe-detail` stays focused.
- **Entry affordances** on recipe detail (board WebRecipeChatEntry): an
  `inverse` "Tweak this recipe" header button + the accent-soft inline
  suggestion strip with `SuggestionChip`s (Make it healthier / spicier / less
  spicy / Half the servings). Each opens the panel; chips pre-fill the prompt.
- **`useRecipeChat.ts`** hook — the `useGeneration` analogue: a pure
  `reduce(state, RecipeTweakEvent)` reducer (streaming summary, partial recipe,
  turns, version, error), subscription lifecycle, abort, plus `send(prompt)` and
  `revert()`. The **live recipe** comes from this hook so the doc updates in place.
- **Components**: `ChatPanel` (sticky right dock, slide-in via CSS transform —
  see board ~420px panel, header with sparkle + "Recipe co-pilot · Tweaking X"),
  `ChatMessageList`, `ChatBubbleUser`, `ChatBubbleAI` (summary + `ChangeChip`
  row), `ChangeChip` (tag→tone map: change=warning, add=accent, remove=danger,
  note=sunk — board lines 43–60), `ChatComposer` (suggestion chips + input +
  arrow-up send), `VersionBar`/apply-bar (version pill `v3 · 2 tweaks` + "Revert
  to original"). Recipe doc: edited/added ingredients show the accent dot +
  italic label (extend recipe-detail's `IngredientChecklist`/method or a
  `recipe-chat` `RecipeDoc`).
- **`recipe-chat.module.css`** + **`strings.ts`**.
- Web tests (merge requirement): Testing Library for the reducer/hook + a
  ChangeChip/bubble render test; Playwright happy path under `e2e/web/specs/`.

### 5. Mobile — `apps/mobile/src/features/recipe-chat/` (new feature dir)

Decompose from day one (the v2 852-LOC sheet is the cautionary tale).

- **Entry** on recipe detail (board MobileRecipeChatEntry): accent-soft hint card
  with `SuggestionChip`s under the summary **and** an extended-pill **floating
  FAB** ("Tweak this recipe", inverse, bottom-right). Either opens the chat sheet.
- **Chat sheet** on the canonical animated `BottomSheet` (M6, 78% height,
  `packages/design-system/src/native/BottomSheet`), header with sparkle +
  "Recipe co-pilot · N tweaks · tap to undo" + revert pill.
- Decomposed pieces under `recipe-chat/`:
  `sheets/RecipeChatSheet.tsx` (composition only),
  `components/ChatMessageList.tsx`, `ChatBubbleUser.tsx`, `ChatBubbleAI.tsx`,
  `ChangeChip.tsx`, `ChatComposer.tsx`, `ApplyBar.tsx` (version + revert), and a
  shared **`useRecipeChat.ts`** hook (same reducer shape as web — consider
  hoisting the pure reducer to `packages/utils` or a shared module so web+mobile
  share it and it's unit-tested once).
- `strings.ts`; RN StyleSheet with tokens (no ad-hoc colors).
- Mobile tests: `useRecipeChat`/reducer unit tests + one Maestro flow
  (`e2e/mobile/recipe-chat.yaml`): open recipe → tweak → summary+chips → recipe
  shows new version → revert.

### 6. Fidelity gate (board §✦ — 4 frames)

Capture references + app screenshots per `tools/design-fidelity` and the
existing `docs/checklists/` pattern; create `docs/checklists/m7-recipe-chat.md`.
Frames: Web entry, Web chat-panel-open, Mobile entry, Mobile chat-sheet-open.
Human-approve the side-by-side report (layout/spacing/type/color). Log the
auto-apply interpretation + any board-silent transient states (streaming/empty)
in `docs/decisions.md`.

### 7. e2e smoke

- Web (`e2e/web/specs/recipe-chat.spec.ts`) + Mobile (`recipe-chat.yaml`):
  generate/open recipe → tweak → summary → applied version persisted (reload
  shows the new version) → revert restores original. Use the mock AI provider
  tape for determinism (frozen streaming states), matching M4.

---

## Critical files

**Reuse / mirror (v3):**
- Streaming spine: `services/ai/src/providers/stream-orchestrator.ts`,
  `pipelines/recipe-emitter.ts`, `pipelines/partial-recipe.ts`,
  `providers/with-fallback.ts`, `prompts/recipe-tool.ts`, `routes/recipes.ts`.
- Wire/contract pattern: `packages/contracts/src/recipes/events.ts`,
  `recipe.ts`, `enums.ts`.
- API streaming pattern: `services/api/src/trpc/routers/recipes.ts`
  (`generateStream`), `lib/ai-stream-client.ts`, `db/schema/recipes.ts`.
- Client hook/feature pattern: `apps/web/src/features/generation/useGeneration.ts`,
  `apps/{web,mobile}/src/features/recipe-detail/*`, animated `BottomSheet`.

**Edit:** `packages/contracts/src/recipes/{recipe.ts,enums.ts,index.ts}`,
`services/ai/src/providers/{types,anthropic,openai,mock,with-fallback}.ts` +
`routes/recipes.ts`, `services/api/src/db/schema/{recipes.ts,index.ts}` +
`trpc/routers/recipes.ts` + `lib/ai-stream-client.ts`,
`apps/{web,mobile}/src/features/recipe-detail/*` (entry affordances + edited/added dots).

**New:** contracts `tweak.ts` + `tweak-events.ts`; ai
`prompts/recipe-tweak.ts`, `prompts/tweak-tool.ts`,
`pipelines/tweak-emitter.ts`, `providers/tweak-orchestrator.ts`; api
`db/schema/recipe-tweaks.ts` + `drizzle/0007_*.sql`; web + mobile
`features/recipe-chat/*`; `e2e/{web/specs/recipe-chat.spec.ts,mobile/recipe-chat.yaml}`;
`docs/checklists/m7-recipe-chat.md`; design board reference notes in `docs/decisions.md`.

**Bug fix (Task 0):**
`packages/design-system/src/native/WeirdnessSlider/SliderTrack.tsx`
(+ keep `weirdness.ts` math untouched).

---

## Verification

Per the roadmap's per-slice + per-milestone gates:

1. **Gates (before each "done" claim):** `podman compose ... up -d`, then
   `pnpm lint && pnpm typecheck && pnpm test` repo-wide green; `pnpm -r build`.
2. **Contracts/AI/API:** schema tests; mock-provider tweak stream tests
   (summary grows, partial resolves, abort/error); API integration (tweak
   persists + version bump + turn row; revert restores + clears thread;
   ownership).
3. **Web/Mobile:** reducer/hook unit tests + Testing Library renders; Playwright
   `recipe-chat.spec.ts` and Maestro `recipe-chat.yaml`:
   open → tweak → summary+chips → live new version → reload persists → revert.
4. **Fidelity:** 4 §✦ frames approved in `docs/checklists/m7-recipe-chat.md`
   (web/mobile entry + chat-open).
5. **Slider:** design-system vitest green + manual smooth-drag capture on mobile.
6. **Stack smoke:** `podman compose up` boots full stack; manual tweak→revert in
   web + mobile against the mock provider.
7. **Roadmap bookkeeping:** mark M7 done in the Status table, log decisions,
   commit.
