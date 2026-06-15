# M4 — Home + generation + result Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per slice; run `pnpm lint && pnpm typecheck && pnpm test` before any commit that claims completion.
>
> **Before starting:** set M4 to `in progress` in the roadmap Status table (`docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md`) and link this plan. **On completion:** mark M4 done in that table and commit.

**Goal:** Ship the recipe-generation vertical slice — board §01 Home (NL prompt + weirdness slider + pantry chips), §04 generating (two streaming beats: **Thinking** → **Drafting**), and §02 **Result** (the single committed recipe + four one-tap branch re-prompts). This lights up the streaming half of the AI service (`generateStructured` / `streamStructured`, currently typed stubs), an end-to-end SSE pipeline (`web/mobile —tRPC subscription→ api —raw SSE (service token)→ ai`), and the first persisted `recipes`.

**Architecture:** Vertical slice in roadmap order **contracts → AI service (streaming) → DB → API → SSE spike → web UI → mobile UI → fidelity gate → e2e**. The AI service streams a discriminated-union event tape over SSE; the API consumes it server-side with a raw SSE reader, persists the recipe on `done`, and re-emits the union to clients as a **tRPC subscription** (`httpSubscriptionLink`). The mock provider replays a **scripted event tape** so the streaming states are frozen and reproducible for the fidelity gate and CI. **One recipe per request** (settled with user) — the Drafting frame renders a single streaming recipe.

**Tech Stack:** Zod (`@pantry/contracts`) · Fastify SSE (`services/ai`) + `@anthropic-ai/sdk` / `openai` streaming · Drizzle + PostgreSQL · tRPC v11 subscriptions / `httpSubscriptionLink` (`@pantry/api`, `@pantry/api-client`) · TanStack Start + React (web) · Expo Router + EventSource ponyfill (mobile) · Vitest + Testing Library + Playwright/Maestro · pixelmatch fidelity harness.

---

## Context

M3 stood up `services/ai` (provider interface, anthropic/openai/mock, single `withFallback`, service-token auth, request IDs, cost logging) and the camera-scan flow. Critically, M3 left **`generateStructured` / `streamStructured` as typed stubs** (`services/ai/src/providers/types.ts` → `notImplementedUntilM4`) so the `AIProvider` interface was stable without `any`. M4 fills those bodies and builds the streaming pipeline on top of the M3 foundation. The repo sits at zero TS errors / zero lint warnings across all workspaces.

M4 is the first milestone with **server-sent streaming end-to-end**. The established slice pattern holds: `@pantry/contracts` is the Zod source of truth → Drizzle schema seeded from those enums → tRPC `protectedProcedure` (now also a subscription) → web/mobile features (`strings.ts` + hooks + `components/` ≤300 lines, route files composition-only) → pixelmatch fidelity gate in `docs/checklists/` → e2e. The new wrinkle is the **SSE transport**, which the roadmap flags as the milestone's top risk and mandates an **early spike** before the full UI is built.

**Why now:** generation is the product's core loop and the screen the Added scan CTA already stubs toward ("See tonight's ideas"). M7 (recipe tweak/chat) reuses this exact streaming machinery; M8 gates generation on entitlements. Getting the event union, the two-beat orchestrator, the partial-recipe emitter, and the SSE-through-Start/Nitro transport right here is the foundation for the rest of the AI UX.

### Scope decisions (settled with user 2026-06-14)

- **tRPC subscription transport (client→API).** Clients consume generation via a tRPC subscription (`recipes.generateStream`) over `httpSubscriptionLink` (SSE). One typed client, end-to-end types, mirrors v2's `generateStream`. The **API→AI hop** is a separate raw SSE reader (server-to-server). Log in `docs/decisions.md`.
- **Persist recipes in M4.** Add `recipes` + `recipe_generation_jobs` tables now. On the stream's `done` event the API writes the recipe (single-write guard) and re-emits a persisted DTO with a real `id`. M5 (library/favorites) reads these existing rows rather than introducing persistence. Log in `docs/decisions.md`.
- **One recipe per request.** Generation produces a single recipe. The §04 **Drafting** frame therefore renders one streaming recipe **without** the board's "Recipe 1 of 3" / queued-recipe cards. This is a deliberate divergence from the board's drafting composition (not a board-silent gap) — record explicitly in `docs/decisions.md` and approve the Drafting frame against the single-recipe variant.
- **Streaming states frozen via a scripted mock event tape.** `mock.ts` `streamStructured` replays a committed, deterministic event tape (pulling_from → thinking_token×N + tool_event pairs → recipe_partial×N → notice? → done). This drives CI orchestrator tests and the Thinking/Drafting fidelity captures — no live AI in CI (same hermetic rule as M3). `anthropic.ts` / `openai.ts` streaming bodies are exercised only by manual smoke with real keys.
- **Branch re-prompts are pure input transforms.** The four Result tiles (Weirder / Faster / Vegetarian / Different angle) build a new generation request from the previous one via a pure `buildBranchInput` helper (idempotent suffix append + weirdness bump), then re-run the same generate path. No new server endpoint.

### The 10 M4 frames

| #  | Frame label (board)              | Section | Platform | Notes |
| -- | -------------------------------- | ------- | -------- | ----- |
| 1  | Web · Home                       | §01     | web      | Hero NL prompt + weirdness + suggestion pills + context cards |
| 2  | Web · 1. Thinking                | §04     | web      | ProseStream + ToolEvents (mock tape, frozen) |
| 3  | Web · 2. Drafting                | §04     | web      | StreamingRecipe, single recipe (no queued cards) |
| 4  | Web · Result                     | §02     | web      | OneRecipeCard + 4 branch tiles |
| 5  | Mobile · Home                    | §01     | mobile   | HeroPromptMobile + ExpiringTapList |
| 6  | Mobile · Home · selecting        | §01     | mobile   | PromptWithChips (selected items as removable chips) |
| 7  | Mobile · Home · browse pantry    | §01     | mobile   | Full pantry pick BottomSheet (search + filters + multiselect) |
| 8  | Mobile · 1. Thinking             | §04     | mobile   | Condensed ProseStream |
| 9  | Mobile · 2. Drafting             | §04     | mobile   | StreamingRecipe, single recipe |
| 10 | Mobile · Result                  | §02     | mobile   | OneRecipeCardMobile + 2×2 branch grid |

Board source (v2, reference-only): `claudeDesignOutput/All Screens.html` §01/§02/§04 → component bodies in `claudeDesignOutput/screens/home-cook-v2.jsx`, `claudeDesignOutput/screens/generating.jsx`, `claudeDesignOutput/components/nl-prompt.jsx`, `claudeDesignOutput/components/primitives.jsx` (`WeirdnessControl`).

### Key v2 reference files (consult, never copy)

| Concern | v2 path |
| ------- | ------- |
| Streaming event union (thinking_token, tool_event, pulling_from, recipe_partial, notice, done, error, aborted) | `packages/contracts/src/ai/events.ts` |
| Recipe DTOs (AIRecipe, AIRecipePartial, AIRecipeGenerationResponse) | `packages/contracts/src/ai/responses.ts`, `packages/contracts/src/recipes.ts` |
| Weirdness band/label logic (0–100 → bands) | `packages/contracts/src/weirdness.ts` |
| Generation request shape (prompt, pantry chips, weirdness) | `packages/contracts/src/ai/requests.ts` |
| Two-beat orchestration (thinking/tools → recipe stream), abort/error/fallback, MAX_TOOL_TURNS | `services/ai/src/providers/stream-orchestrator.ts` |
| Partial-JSON recovery + throttled snapshot emitter | `services/ai/src/providers/recipe-partial-emitter.ts`, `partial-recipes.ts` |
| Generation system prompt (band guidance, intensity calibration, dietary rules, craft) | `services/ai/src/prompts/recipes.ts` |
| AI-service SSE route (heartbeat, headers, x-accel-buffering, socket-close abort) | `services/ai/src/routes/recipes.ts` |
| Raw SSE consumer (tiny parser, undici abort workaround, Zod-validate frames) | `services/api/src/lib/aiClient.ts` |
| API generate subscription (single-write-on-done, re-emit persisted DTO, abort) | `services/api/src/modules/recipes/router.ts` |
| Four branch chips (idempotent suffix append, weirdness bump) | `apps/mobile/src/lib/generation/branches.ts` |
| **Anti-pattern to avoid** (monolithic generating screen) | v2 generating screens |

---

## Domain model (single source of truth — `@pantry/contracts`)

New `recipes/` and `ai/` contract pieces. Reuse the existing M2 pantry enums where recipes reference pantry usage.

```ts
// Weirdness (ported intent from v2 weirdness.ts) — score 0–100
export const WEIRDNESS_BANDS = ['normal', 'curious', 'interesting', 'adventurous', 'chaotic'] as const;
export function weirdnessBand(score: number): WeirdnessBand;   // for prompt calibration
// The 4 board slider display labels (normal / curious / adventurous / chaotic evil) live in feature strings.

// Branch re-prompt actions
export const BRANCH_ACTIONS = ['weirder', 'faster', 'vegetarian', 'new-angle'] as const;

// Recipe difficulty
export const RECIPE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
```

- `generationRequestSchema` = `{ prompt: string(1..), pantryItemIds: uuid[], weirdness: number(0..100) }`
- `recipeIngredientSchema` = `{ name, quantity: number|null, unit: string|null, optional, note: string|null }` — each field defensively typed so partial snapshots never throw.
- `aiRecipeSchema` = `{ title, summary, weirdnessScore, ingredients[], steps[], timeMinutes, difficulty, substitutions[], pantryItemsUsed[], confidence, caveats[], whySuggested, observation: string|null }`.
- `aiRecipePartialSchema` = `aiRecipeSchema.partial()` (every field optional for mid-stream snapshots).
- **`generationEventSchema`** — discriminated union on `type` (the wire contract, single source of truth for the SSE frames):
  - `pulling_from` `{ must: string[], maybe: string[] }`
  - `thinking_token` `{ text, seq, t }`
  - `tool_event` `{ id, name, state: 'pending'|'complete'|'error', display, result: string|null, seq, t }`
  - `recipe_partial` `{ recipe: AIRecipePartial, complete: boolean, seq, t }` (no `index` — single recipe)
  - `notice` `{ text }`
  - `done` `{ recipe: Recipe }` (persisted DTO with id — re-emitted by API)
  - `error` `{ code, message }`
  - `aborted` `{}`
- `recipeSchema` (persisted DTO) = `aiRecipeSchema` + `{ id, userId, prompt, weirdness, createdAt }`.

All exported from `@pantry/contracts` `index.ts`. The union members each carry monotonic `seq` + `t` (ms-since-start) so clients can drop out-of-order frames.

---

# Slice A — Contracts: generation request, event union, recipe + weirdness + branches

**Files:**
- Create: `packages/contracts/src/recipes/enums.ts`, `recipes/recipe.ts`, `recipes/generation.ts`, `recipes/events.ts`, `recipes/weirdness.ts`
- Modify: `packages/contracts/src/index.ts` (barrel)
- Create in utils: `packages/utils/src/branches.ts` (pure `buildBranchInput`) + `packages/utils/src/branches.test.ts`
- Test: `packages/contracts/src/recipes/events.test.ts`, `weirdness.test.ts`, `recipe.test.ts`

### Tasks
- [x] **A1 — failing tests**: `generationRequestSchema` accepts a valid body / rejects empty prompt / clamps-or-rejects weirdness out of 0–100; each `generationEvent` variant parses and the discriminated union rejects an unknown `type`; `aiRecipePartialSchema` accepts `{ title }` alone (partial) while `aiRecipeSchema` requires the full set; `weirdnessBand` maps representative scores to the right band; `buildBranchInput` appends each suffix **idempotently** (spamming the same chip doesn't duplicate) and `weirder` bumps weirdness (+20, capped 100).
- [x] **A2 — implement** the schemas + `weirdnessBand` (port the *idea* from v2 `weirdness.ts`, mapped to our bands) + `buildBranchInput` in `@pantry/utils` (port intent from v2 `branches.ts`: `appendOnce` + weirdness bump). Export all from the contracts barrel.
- [x] **A3 — green + commit** `feat(contracts): recipe generation request, event union, recipe DTO + weirdness + branch transforms`.

---

# Slice B — AI service: generation prompt + two-beat stream orchestrator + provider bodies + SSE route

Fill the M3 stubs and build the streaming pipeline. This is the milestone's net-new AI infrastructure.

**Files:**
- Create: `services/ai/src/prompts/recipes.ts` (system prompt: band guidance, intensity calibration, dietary rules, beginner-craft rules — port intent from v2)
- Create: `services/ai/src/pipelines/partial-recipe.ts` (tolerant partial-JSON parse → `AIRecipePartial`, port intent from v2 `partial-recipes.ts`) + `recipe-emitter.ts` (throttled, deduped snapshot emitter)
- Create: `services/ai/src/providers/stream-orchestrator.ts` (two beats; raw provider events → canonical `generationEvent` union; abort/error/notice; `MAX_TOOL_TURNS`)
- Create: `services/ai/src/providers/mock-tape.ts` (the committed scripted event tape) — wire into `mock.ts`
- Modify: `services/ai/src/providers/mock.ts`, `anthropic.ts`, `openai.ts` — implement `generateStructured` + `streamStructured` (replace `notImplementedUntilM4`); `services/ai/src/providers/types.ts` — replace the placeholder `StreamEvent` with the imported `generationEvent` union from `@pantry/contracts`
- Create: `services/ai/src/routes/recipes.ts` (`POST /recipes/generate/stream`, SSE)
- Test: `stream-orchestrator.test.ts`, `recipe-emitter.test.ts`, `partial-recipe.test.ts`, `mock.test.ts` (tape replay), `routes/recipes.test.ts` (SSE frames via `app.inject`)

### Two beats (the streaming contract)
1. **Thinking beat** — provider emits reasoning prose (`thinking_token`) and tool invocations (`tool_event` pending→complete; e.g. `read_pantry() → 14 items`). Server emits `pulling_from` first (must = mustInclude + items expiring ≤3 days; maybe = the rest).
2. **Drafting beat** — provider streams the recipe JSON top→bottom; `recipe-emitter` accumulates fragments, tolerantly parses partials, emits **deduped, throttled** `recipe_partial` snapshots (mark `complete: true` once the snapshot passes full `aiRecipeSchema`), then a final flush guarantees the last state lands. End with `notice?` then `done`.

### Tasks
- [x] **\1 — partial parser + emitter (TDD).** `partial-recipe.ts`: tolerant JSON recovery (no external dep; never throws, returns `null` on irrecoverable input). `recipe-emitter.ts`: `feed(fragment, now)` (throttle window, default 180ms, dedup by serialized snapshot) + `flush()` (bypass throttle). Tests: incremental fragments yield monotonically richer snapshots; identical snapshots deduped; `complete:true` only when full-schema-valid; flush always emits last state.
- [ ] **B2 — generation prompt.** `prompts/recipes.ts`: system prompt with per-band posture + intensity calibration (floor/mid/ceiling within band), hard dietary rules, and beginner-craft guidance (prep specs in ingredient `note`, doneness cues, ordered steps). Port the *structure* from v2 `prompts/recipes.ts`; do not name concrete dishes. Pure function `buildGenerationSystemPrompt(weirdness, pantryChips, constraints)`.
- [ ] **B3 — stream orchestrator (TDD).** `stream-orchestrator.ts`: consumes a provider's raw stream, converts raw thinking/tool/text events into the canonical `generationEvent` union (monotonic `seq` + `t`), runs the recipe beat through the emitter, picks the recipe's `observation` into a `notice`, terminates with `done` carrying the validated `AIRecipe`. Handle: **abort** (signal mid-stream → emit `aborted`, stop), **no response** (→ `error` code `no_response`), **invalid recipe** (→ `error` code `invalid_response`), `MAX_TOOL_TURNS` cap. Test against a **fake provider** yielding scripted raw events — the roadmap's required "orchestrator unit tests incl. abort/error/fallback."
- [ ] **B4 — mock tape + `streamStructured`/`generateStructured` on mock (TDD).** `mock-tape.ts`: a deterministic committed sequence producing the board's Thinking prose + 3 tool events + a streaming recipe ending in a canned `AIRecipe`. `mock.ts` `streamStructured` replays it through the orchestrator; `generateStructured` returns the canned recipe directly. Test asserts the full frozen frame order + final recipe shape (this tape backs the fidelity captures).
- [ ] **B5 — anthropic + openai streaming bodies.** `anthropic.ts`: `messages.stream` with extended thinking + the `emit_recipe` tool (single recipe), map SDK deltas → raw orchestrator events, record token usage. `openai.ts`: analogous via streaming + JSON-schema/tool. Lazy key validation (mock-only dev needs no keys). **No live-call test in CI** — covered by typecheck + manual smoke. `withFallback` already wraps these from M3 (verify it composes with the streaming path; extend its test to a streaming case if needed).
- [ ] **B6 — SSE route (TDD).** `routes/recipes.ts`: `POST /recipes/generate/stream` (service-token auth, reuse M3 hook), `text/event-stream` with `cache-control: no-cache, no-transform`, `connection: keep-alive`, `x-accel-buffering: no`; `flushHeaders()` immediately; **heartbeat comment every 10s**; `retry: 30000` on open; frame format `event: <type>\ndata: <json>\n\n`. Abort on **response-socket close** (`reply.raw.on('close')`, *not* request) → `AbortController.abort()` tears down the provider stream. Hard timeout (`AI_PROVIDER_TIMEOUT_MS`) → synthesized `error` code `timeout`. Test via `app.inject` (mock provider): assert ordered SSE frames terminate in `done`; assert 401 without service token. Commit per task (`feat(ai): partial-recipe emitter`, `feat(ai): generation prompt`, `feat(ai): two-beat stream orchestrator`, `feat(ai): mock event tape + streaming provider bodies`, `feat(ai): /recipes/generate/stream SSE route`).

---

# Slice C — DB: recipes + recipe_generation_jobs tables + migration

**Files:**
- Create: `services/api/src/db/schema/recipes.ts`
- Modify: `services/api/src/db/schema/index.ts` (barrel)
- Generated: `services/api/drizzle/0003_*.sql` + meta

### Tasks
- [x] **C1 — schema.** `recipeDifficulty` = `pgEnum('recipe_difficulty', RECIPE_DIFFICULTIES)` (from `@pantry/contracts`). `recipes` table: `id uuid pk`, `userId → users.id (cascade)`, `prompt text notNull`, `weirdness integer notNull`, `title text notNull`, `summary text`, `data jsonb $type<AIRecipe>()` (the full recipe body), `provider text`, `model text`, `tokensUsed integer`, `createdAt`/`updatedAt`. `recipe_generation_jobs` table: `id uuid pk`, `userId → users.id (cascade)`, `request jsonb $type<GenerationRequest>()`, `status` (`pgEnum`: `streaming`/`succeeded`/`failed`/`aborted`), `recipeId → recipes.id (set null)` nullable, `error text` nullable, `createdAt`/`updatedAt`. Add both to the barrel.
- [x] **C2 — generate + apply + typecheck.** `pnpm --filter @pantry/api db:generate` → `0003_*`; `podman compose up -d && pnpm --filter @pantry/api db:migrate && pnpm typecheck`. Commit `feat(api): recipes + recipe_generation_jobs schema + migration`.

---

# Slice D — API: recipes subscription + raw SSE consumer + persistence

**Files:**
- Create: `services/api/src/lib/ai-stream-client.ts` (raw SSE reader: tiny parser, undici abort workaround, Zod-validate each frame against `generationEventSchema`)
- Create: `services/api/src/trpc/routers/recipes.ts` (`generateStream` subscription)
- Modify: `services/api/src/trpc/router.ts` (mount `recipes`), `deps.ts` (inject the stream client), `services/api/src/env.ts` (reuse M3 `AI_SERVICE_URL`/`AI_SERVICE_TOKEN`; add `AI_PROVIDER_TIMEOUT_MS` if not present)
- Test: `services/api/test/recipes.integration.test.ts`

### Tasks
- [x] **D1 — raw SSE consumer (TDD).** `ai-stream-client.ts`: `streamGeneration(req, { signal })` → `AsyncIterable<GenerationEvent>` from `fetch(${AI_SERVICE_URL}/recipes/generate/stream)` with `Authorization: Bearer` + propagated `x-request-id`. Tiny parser: buffer via `TextDecoder`, split on `\n\n`, ignore `:` heartbeat comments, `JSON.parse` `data:` payload, validate with `generationEventSchema` (drop invalid frames). **Undici abort workaround:** use a local fetch `AbortController`; once the reader is owned, rewire `opts.signal` to `reader.cancel()` (avoids `ERR_INVALID_STATE`). Test against a fake SSE server / stubbed fetch yielding canned frames; assert abort cancels the reader.
- [x] **D2 — `recipes.generateStream` subscription (TDD).** tRPC v11 subscription `protectedProcedure.input(generationRequestSchema).subscription(async function*({ ctx, input, signal }) {...})`: write a `recipe_generation_jobs` row (`streaming`); yield each event from `streamGeneration`; on `done`, **persist the recipe once** (single-write guard), update the job (`succeeded` + `recipeId`), and **re-emit `done` carrying the persisted `Recipe` DTO** (real id) instead of the raw AI recipe; on `error`/`aborted`, update the job accordingly. Abort: tRPC cancels the generator on unsubscribe → `signal` fires → SSE reader cancels → AI service hangs up. Integration test (fake stream client replaying the mock tape) asserts: events flow through, the recipe row is written exactly once, `done` carries a real id, UNAUTHORIZED without a session, and an early unsubscribe marks the job `aborted` + writes no recipe.
- [x] **D3 — gates + commit** `feat(api): recipes.generateStream subscription + raw SSE consumer + persistence`.

---

# Slice E — api-client: subscription link + **SSE spike** (de-risk Start/Nitro buffering)

The roadmap's mandated early spike. Prove the SSE pipeline streams **incrementally** (not buffered) through the web app's real TanStack Start/Nitro runtime **before** building the full UI.

**Files:**
- Modify: `packages/api-client/src/index.ts` (add `httpSubscriptionLink`, keep `httpBatchLink`; `splitLink` on `op.type === 'subscription'`); mobile needs an `EventSource` ponyfill passed to the link (RN fetch can't stream) — add `react-native-sse` (or `event-source-polyfill`), wire via the link's `EventSource` option
- Create: a minimal web spike route/dev page that calls `api.recipes.generateStream.subscribe(...)` with the mock provider and renders frames as they arrive (timestamps visible)
- Test: `packages/api-client` unit test that the subscription link is selected for subscription ops; an e2e/manual note proving incremental delivery

### Tasks
- [x] **E1 — subscription link (TDD where possible).** Add `httpSubscriptionLink` + `splitLink` to `createApiClient`; preserve superjson transformer + the existing `exactOptionalPropertyTypes` fetch shim. Mobile: accept an injectable `EventSource` (ponyfill) so the same client works under Expo. Unit-test link selection.
- [x] **E2 — SSE spike.** Drive `recipes.generateStream` end-to-end through the running web app (Start/Nitro) against the **mock tape**; confirm frames arrive **one at a time with increasing timestamps** (not a single buffered flush at the end). If buffered, resolve at this layer (disable response compression/buffering on the streaming path; confirm `x-accel-buffering: no` survives the proxy; ensure no middleware reads the body). Record the outcome + any fix in `docs/decisions.md`. **This gate must pass before Slices F/G.** Commit `feat(api-client): subscription link + SSE transport spike`.

---

# Slice F — Web UI: Home → Thinking → Drafting → Result (board §01, §04, §02)

Decompose hard — streaming state lives in a hook, never inline JSX; route files composition-only; components ≤200 LOC.

**Files:**
- Create route group under `apps/web/src/routes/_authed/`: `cook.index.tsx` (Home, composition-only → `<HomeScreen/>`), `cook.generate.tsx` (Thinking/Drafting/Result driven by one stream hook). Home prompt submit navigates to the generate route.
- Create: `apps/web/src/features/generation/strings.ts` (all board copy incl. the 4 weirdness slider labels + 4 branch tiles), `useGeneration.ts` (subscription consumer + reducer: phase `thinking`→`drafting`→`result`, prose buffer, tool-event list, partial recipe, error/abort, branch re-run), `useGeneration.test.ts`
- Create components: `HomeScreen.tsx`, `HeroPrompt.tsx` (NL textarea + `sparkles` eyebrow), `WeirdnessControl.tsx` (0–100 gradient range, 4-label display — shared primitive candidate; port from `primitives.jsx`), `SuggestionPills.tsx`, `HomeContextCards.tsx` (expiring + recently-saved), `ThinkingPanel.tsx` (`ProseStream` + `ToolEvent` + caret), `CollapsedReasoning.tsx` ("Thought for 3.4s · N tool calls"), `DraftingRecipe.tsx` (`StreamingRecipe`: header, meta, streaming ingredients, gated method), `OneRecipeCard.tsx` (the committed pick: pills, two-column ingredients/method, action buttons), `BranchRow.tsx` (4 tiles: flame/timer/leaf/shuffle icons + label + subtitle), `StopButton.tsx`
- Create: `generation.module.css` (token vars only)
- Test: `useGeneration.test.ts`, `HomeScreen.test.tsx`, `BranchRow.test.tsx`, `generation.test.tsx` (Testing Library happy path — **web slice without tests does not merge**)

### Tasks
- [x] **F1 — `useGeneration` hook (TDD).** Subscribe to `api.recipes.generateStream`; reduce events into render state (phase machine, prose tail, tool-event list, partial recipe snapshot, final recipe, error/aborted); expose `start(input)`, `stop()` (unsubscribe → abort), and `branch(action)` (build a new request via `buildBranchInput`, re-`start`). Test with a mocked subscription emitting the mock-tape frames.
- [x] **F2 — Home (§01).** `HeroPrompt` + `WeirdnessControl` + `SuggestionPills` + context cards, matching the board hero composition (32px display textarea, gradient weirdness track, "Cook this" primary). Submit → navigate to generate with the prompt + weirdness + selected pantry chips.
- [x] **F3 — Thinking + Drafting (§04).** `ThinkingPanel` renders the prose stream + interspersed tool events + blinking caret; transitions to `CollapsedReasoning` + `DraftingRecipe` (single streaming recipe — **no queued cards**, per scope decision) when the drafting beat begins. `StopButton` calls `stop()`.
- [x] **F4 — Result (§02).** `OneRecipeCard` (pills "uses N expiring", two-column ingredients/method, "Start cooking" / "Save" / "Share") + `BranchRow` (4 tiles). "Start cooking"/"Save" are **stubs** until M5/M6 (navigate/no-op, precedent set by M2/M3); branch tiles re-run generation. Commit `feat(web): home + streaming generation + result (board §01/§04/§02)`.

---

# Slice G — Mobile UI: Home (+ selecting + browse-pantry sheet) → Thinking → Drafting → Result (§01, §04, §02)

**Files:**
- Modify `apps/mobile/src/app/(tabs)/`: Home tab (likely the existing home/cook entry) composition-only → `<HomeScreen/>`. Add a generate route (stack/modal) → `<GenerateScreen/>`. Wire the M3 Added-step "See tonight's ideas" stub CTA to navigate here.
- Create: `apps/mobile/src/features/generation/strings.ts`, `useGeneration.ts` (mirror web hook; same subscription contract, RN EventSource ponyfill via the api-client), `useGeneration.test.ts`
- Create components: `HomeScreen.tsx`, `HeroPromptMobile.tsx`, `WeirdnessControl` (RN variant, `size="sm"`), `ExpiringTapList.tsx` + `ExpiringTapRow.tsx` (checkbox + expiring pill), `PromptWithChips.tsx` (selected items → removable chips, "Cooking with" eyebrow), `GenerateScreen.tsx` (switch on phase), `ThinkingPanelMobile.tsx`, `DraftingRecipeMobile.tsx`, `OneRecipeCardMobile.tsx`, `BranchGrid.tsx` (2×2)
- Create sheet: `sheets/PantryPickSheet.tsx` on the canonical `BottomSheet` (search + category filter pills + grouped multiselect + "Add to prompt" footer) — board "Mobile · Home · browse pantry"
- Test: `useGeneration.test.ts`, `PantryPickSheet.test.tsx`, `ExpiringTapList.test.tsx`, plus `testID`s for Maestro

### Tasks
- [ ] **G1 — Home + selecting (§01).** `HeroPromptMobile` (22px display, `size="sm"` weirdness, capped chips, arrow-right submit) + `ExpiringTapList` ("Tap to add · expiring", checkboxes, "Browse pantry · N" link). Selecting state: tapped rows become removable chips via `PromptWithChips` ("Cooking with" eyebrow, count + "ready", "Cook this" footer). Hook-test the selection/chip state.
- [ ] **G2 — browse-pantry sheet (§01).** `PantryPickSheet` on the canonical `BottomSheet` (78% height): search bar, category filter pills (All/Expiring/Fridge/Pantry/Produce/Dairy), grouped multiselect (Needs using / Fridge / Pantry), "{N} selected · Add to prompt" footer. Reuse M2 pantry list data + labels (`pantry-shared/labels.ts`).
- [ ] **G3 — generating + result (§04, §02).** `GenerateScreen` switches phase via the shared `useGeneration`: condensed `ThinkingPanelMobile` → `DraftingRecipeMobile` (single recipe) → `OneRecipeCardMobile` + `BranchGrid` (2×2: Weirder / Faster (<15) / Vegetarian / New angle). Stop + branch wired as on web. Commit `feat(mobile): home + browse-pantry sheet + streaming generation + result (board §01/§04/§02)`.

---

# Slice H — Fidelity gate + e2e + decisions + roadmap status

**Files:** `docs/checklists/m4-generation.md`, `docs/decisions.md`, `tools/design-fidelity/references/*` (committed), `e2e/web/generation.spec.ts`, `e2e/mobile/generation.yaml`, roadmap Status table.

### Tasks
- [x] **H1 — capture references** for the 10 §01/§02/§04 frames (`pnpm -C tools/design-fidelity capture:references`); verify slugs + manifest; commit `test(fidelity): capture M4 §01/§02/§04 reference frames`.
- [x] **H2 — capture + compare web frames.** Drive the web app to Home, Thinking, Drafting, Result with mock-data fixtures + the **mock event tape** (streaming states frozen at a scripted frame); Playwright 1280×860 → pixelmatch report → iterate to faithful → record approval rows in `docs/checklists/m4-generation.md`. Drafting approved against the **single-recipe variant** (note the board divergence).
- [ ] **H3 — capture + compare mobile frames.** Pinned simulator (status-bar override + frozen clock per M1–M3), `xcrun simctl io screenshot` for Home, Home·selecting, Home·browse-pantry, Thinking, Drafting, Result → pixelmatch → approve in the checklist.
- [x] **H4 — e2e.** Web `e2e/web/generation.spec.ts`: sign in → Home → type prompt → submit → assert Thinking frames stream → Drafting → Result recipe present → tap a branch tile → assert a new generation runs (mock provider). Mobile `e2e/mobile/generation.yaml` (Maestro): home → prompt → generating → result; verify locally against Expo Go (CI execution deferred per M1–M3 precedent). Note results in the checklist.
- [ ] **H5 — decisions + status.** Append to `docs/decisions.md` (newest first): (a) tRPC-subscription client transport + raw SSE server-to-server; (b) recipes persisted in M4 (`recipes` + `recipe_generation_jobs`), single-write-on-done; (c) **single recipe per request → Drafting frame diverges from the board's "1 of 3" / queued cards**; (d) streaming states frozen via scripted mock tape; (e) branch re-prompts as pure input transforms; (f) the SSE-spike outcome/fix from E2; (g) Start/Result action buttons stubbed until M5/M6. Mark **M4 done** in the roadmap Status table and link this plan + `docs/checklists/m4-generation.md`. Final sweep: `podman compose up -d && pnpm lint && pnpm typecheck && pnpm test && pnpm -r build`. Commit `docs: M4 complete; decisions logged; roadmap status updated`.

---

## Verification (end-to-end)

1. **Unit/contract:** `pnpm test` green — contracts (generation request, event union, recipe partial/full, weirdness, `buildBranchInput`); AI service (partial parser, emitter throttle/dedup, **orchestrator incl. abort/error/fallback**, mock-tape replay, SSE route frames + 401); API (`generateStream` integration: events flow, single-write persistence, real-id `done`, unsubscribe→aborted, UNAUTHORIZED); web/mobile `useGeneration` hook tests; `HomeScreen`/`BranchRow`/`PantryPickSheet` tests.
2. **Types & lint:** `pnpm typecheck` (0 errors, all workspaces) + `pnpm lint` (`--max-warnings 0`, no `eslint-disable`/`any`). Every generation component ≤300 (target 200) LOC; route files composition-only; streaming state in hooks/reducers, never inline JSX.
3. **Build:** `pnpm -r build` succeeds.
4. **DB:** `db:migrate` applies `0003_*` on a fresh DB; `recipes` + `recipe_generation_jobs` present.
5. **Streaming transport (the milestone risk):** the SSE spike (E2) proves incremental, non-buffered delivery through Start/Nitro against the mock tape; heartbeats keep idle connections alive; abort (Stop / unsubscribe) tears the chain down API→AI→provider; service-token still required on the AI SSE route (401 without).
6. **Fidelity:** all 10 §01/§04/§02 frames approved in `docs/checklists/m4-generation.md` (streaming frozen via mock tape; Drafting approved against the single-recipe variant).
7. **E2E:** web `generation.spec.ts` green (prompt→stream→result→branch); mobile Maestro `generation.yaml` verified locally; existing M1–M3 e2e still green.
8. **Manual smoke:** `podman compose up` with a real `ANTHROPIC_API_KEY` + `DEFAULT_AI_PROVIDER=anthropic` → type a prompt on web and device → watch Thinking prose + tool events stream → Drafting recipe build top→bottom → Result; tap "Weirder" → a new generation runs; flip to `mock` → deterministic frozen tape, no keys needed.

## Self-review notes

- **Spec coverage:** every M4 roadmap bullet mapped — contracts (generation request, full streaming union, recipe DTO, 4 branch actions, weirdness 0–100) in Slice A; AI streaming pipeline with two beats (thinking prose+tools → recipe top→bottom) in Slice B; the **early SSE spike** through Start/Nitro via mock event tape in Slice E; web Home/Thinking/Drafting/Result+4 tiles in Slice F; mobile Home/selecting/browse-pantry/both beats/Result 2×2 grid in Slice G; gate = 10 frames frozen via scripted tape + orchestrator unit tests (abort/error/fallback) + e2e prompt→stream→result in Slices B3/F1/H.
- **One streaming machine, reused:** the orchestrator + event union + `useGeneration` hook are the exact substrate M7 (recipe tweak/chat) extends — built decomposed from day one to avoid v2's monolithic generating/tweak screens.
- **Scope divergence flagged:** single-recipe (user-chosen) means the Drafting board frame is approved against a single-recipe variant — explicitly logged, not silently shipped.
- **No new suppressions:** zero `eslint-disable`/`any`/`@ts-expect-error`; the M3 `notImplementedUntilM4` stubs are replaced with real bodies and the placeholder `StreamEvent` is swapped for the contract union.
- **Deferred to later milestones (intentionally):** library/favorites queries over the now-persisted recipes (M5); cook sessions / "Start cooking" + consume (M6); recipe tweak/chat streaming reuse (M7); entitlement/quota gating on generation (M8).
