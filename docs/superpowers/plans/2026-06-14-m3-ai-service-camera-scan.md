# M3 — AI Service v1 + Camera Scan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per slice; run `pnpm lint && pnpm typecheck && pnpm test` before any commit that claims completion.
>
> **On completion:** write this plan into the roadmap Status table for M3 (replace the `—`), mark M3 done, and commit.

**Goal:** Stand up the `services/ai` service properly (provider interface, Anthropic/OpenAI/mock implementations, single `withFallback` decorator, service-token auth, request IDs, cost logging) and ship the board §08 camera-scan flow: mobile 4-step **Viewfinder → Detecting → Review → Added**, backed by an API scan lifecycle (`image_scans` record) and a confirm-to-pantry transaction.

**Architecture:** Vertical slice in the roadmap order **contracts → AI service → DB → API → mobile UI → fidelity gate → e2e**. New flow: `mobile —tRPC→ api —REST + service-token (x-request-id propagated)→ ai —→ Anthropic | OpenAI`. The AI service is network-isolated and bearer-token authenticated (fixes v2's open port). Scan extraction runs **synchronously** inside one tRPC mutation; the API persists an `image_scans` row (status + extracted JSON + token/cost metadata) for audit, then a separate `scan.confirm` mutation creates the selected pantry items in a transaction (reusing M2's pantry insert + inventory-event pattern). No SSE this milestone — streaming lands in M4.

**Tech Stack:** Zod (`@pantry/contracts`) · Fastify REST + `@anthropic-ai/sdk` / `openai` SDKs (vision + tool use) · Drizzle + PostgreSQL · tRPC (`@pantry/api`) · Expo Router + `expo-camera` (mobile) · Vitest + Testing Library + Playwright/Maestro · pixelmatch fidelity harness.

---

## Context

M2 delivered the pantry (CRUD, inventory event log, expiration ranking, 10 frames). The repo is at zero TS errors / zero lint warnings across all workspaces, with the established slice pattern: `@pantry/contracts` as the Zod source of truth → Drizzle schema seeded from those enums → tRPC `protectedProcedure` router with transactional writes → web/mobile features (`strings.ts` + hooks + `components/` ≤300 lines, route files composition-only) → pixelmatch fidelity gate recorded in `docs/checklists/` → e2e.

M3 is the first milestone that introduces the **AI service** and the first that consumes a camera. `services/ai` does not exist yet — it is built from scratch this milestone. The camera screen is the file that ballooned to **1,219 LOC in v2** (`apps/mobile/src/app/(tabs)/scan.tsx`, a monolith of inline steps + StyleSheets); M3 enforces decomposition: a `useScanFlow` state-machine hook plus one component per step, each ≤200 lines.

**Why now:** every later milestone needs a real AI service (M4 generation, M7 tweaks, M8 entitlement gating on scan/generation). Getting the provider interface, `withFallback`, service-token auth, request-ID propagation, and cost logging right here — with the mock provider that keeps CI hermetic — is the foundation the rest of the AI work builds on.

### Scope decisions (settled with user 2026-06-14)

- **Synchronous extract + persisted record.** `scan.extract` forwards the image to the AI service and returns extracted items in one round-trip, writing an `image_scans` row (status, extracted JSON, provider/model/tokens). No job queue or polling endpoint — extraction is a few seconds. The board "Detecting" frame is the client-side waiting state. Log in `docs/decisions.md`.
- **Defer blob storage.** The image travels base64 API→AI and the raw bytes are discarded after extraction. `image_scans.raw_image_url` stays nullable; no object store is added this milestone. Log in `docs/decisions.md`.
- **"Added" CTAs are stubs.** Board frame 4 shows "See tonight's ideas" / "3 new ideas ready" → generation is **M4**. These render per board but navigate to pantry / no-op until M4 (same precedent as M2's stubbed Cook button). Log in `docs/decisions.md`.
- **No live AI calls in CI.** All three providers are built; `mock.ts` is the default in tests and the fidelity gate. `anthropic.ts` / `openai.ts` are exercised only with real keys in manual/dev runs (keys optional in env, validated lazily by the provider that needs them).
- **Camera fidelity uses a fixture background.** The iOS simulator has no camera; the Viewfinder/Detecting frames capture over a committed fixture fridge image (the board itself composites a fake scene). Document as a board-silent composition in `docs/decisions.md`.

### The 4 M3 frames (board §08, mobile-only — 390×800)

| # | Frame label (board) | Section | Platform |
| - | ------------------- | ------- | -------- |
| 1 | Viewfinder (step 1/4) | §08 | mobile |
| 2 | Detecting (step 2/4) | §08 | mobile |
| 3 | Review items (step 3/4) | §08 | mobile |
| 4 | Added to pantry (step 4/4) | §08 | mobile |

Board source (v2, reference-only): `claudeDesignOutput/All Screens.html` §08 (lines 249–254) → component bodies in `claudeDesignOutput/components/mobile-screens-b.jsx` (`MobileCam1_Viewfinder` … `MobileCam4_Added`, ~lines 82–415). There are **no web frames** for the scan flow.

### Key v2 reference files (consult, never copy)

| Concern | v2 path |
| ------- | ------- |
| Scan system prompt + anti-hallucination rules | `services/ai/src/prompts/scans.ts` |
| Normalization + dedup (unit aliases, enum coercion) | `services/ai/src/providers/scan-normalize.ts` |
| Anthropic image extraction (vision + forced tool use + post-process) | `services/ai/src/providers/anthropic.ts:397–456` |
| AI service `/scans/extract` route (+ fallback-to-empty) | `services/ai/src/routes/scans.ts` |
| API scan router + AI client wrapper | `services/api/src/modules/scans/router.ts`, `aiClient.ts` |
| Mobile scan lifecycle hook | `apps/mobile/src/lib/scan/useScanFlow.ts` |
| Contracts (ExtractedIngredient, ImageScanResult) | `packages/contracts/src/scans.ts` |
| **Anti-pattern to avoid** (1,219-LOC monolith) | `apps/mobile/src/app/(tabs)/scan.tsx` |

---

## Domain model (single source of truth — `@pantry/contracts`)

The AI extraction reuses the **existing M2 pantry enums** (`PANTRY_CATEGORIES`, `PANTRY_LOCATIONS`, `PANTRY_UNITS`) so storage and AI output never drift — the normalization pipeline coerces free-form model output onto these. New M3 contract pieces:

```ts
// services/ai accepted image types
export const SCAN_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// image_scans.status lifecycle
export const SCAN_STATUSES = ['processing', 'succeeded', 'failed', 'confirmed'] as const;
```

- `AIImageExtractionRequest` = `{ imageBase64, mediaType: SCAN_MEDIA_TYPES, hint?: string }`
- `ExtractedIngredient` = `{ name, normalizedName, category: PantryCategory|null, location: PantryLocation|null, quantity: number|null, unit: PantryUnit|null, confidence: 0–1, notes: string|null }` — every enum/number field defensively `.catch(null)` so malformed model output never throws.
- `ImageScanResult` = `{ ingredients: ExtractedIngredient[], duplicatesMerged: string[], reviewNotes: string|null }`
- `AIImageExtractionResponse` = `{ provider, model, result: ImageScanResult, tokensUsed: { input, output } }`
- `imageScanSchema` (DTO) = `{ id, status, result, createdAt }`
- `confirmScanInput` = `{ scanId: uuid, items: CreatePantryItemInput[] }` (reuses M2's `createPantryItemInput` per row)

---

# Slice A — Contracts: scan + AI extraction schemas

**Files:**
- Create: `packages/contracts/src/scan/enums.ts`, `scan/extraction.ts`, `scan/record.ts`
- Modify: `packages/contracts/src/index.ts` (barrel)
- Test: `packages/contracts/src/scan/extraction.test.ts`

### Tasks
- [ ] **A1 — failing tests**: valid `AIImageExtractionRequest` accepted; bad `mediaType` rejected; `ExtractedIngredient` with an out-of-enum `category`/`unit` parses to `null` (not a throw) via `.catch(null)`; `confirmScanInput` requires `scanId` + ≥1 item; `SCAN_STATUSES`/`SCAN_MEDIA_TYPES` exact membership.
- [ ] **A2 — implement** the schemas above. Reuse M2 `pantryCategorySchema`/`pantryLocationSchema`/`pantryUnitSchema` for the nullable enum fields; reuse `createPantryItemInput` inside `confirmScanInput`. Export all from `index.ts`.
- [ ] **A3 — green + commit** `feat(contracts): scan extraction + image-scan record DTOs`.

---

# Slice B — AI service scaffold + providers + normalization

Stand up `services/ai` from zero, mirroring `services/api` conventions (`package.json` type:module, `tsconfig.json` extending base, `Containerfile`, Vitest). This is the bulk of the milestone's net-new infrastructure.

**Files:**
- Create: `services/ai/package.json`, `tsconfig.json`, `vitest.config.ts`, `Containerfile`
- Create: `services/ai/src/index.ts` (startup), `src/env.ts` (zod-validated), `src/server.ts` (Fastify + service-token hook + request-id + `/health`)
- Create: `src/providers/types.ts` (the `AIProvider` interface), `src/providers/mock.ts`, `src/providers/anthropic.ts`, `src/providers/openai.ts`, `src/providers/with-fallback.ts`, `src/providers/index.ts` (provider selection by env)
- Create: `src/prompts/scans.ts` (system prompt + tool schema), `src/pipelines/scan-normalize.ts` (unit aliases, enum coercion, dedup)
- Create: `src/routes/scans.ts` (`POST /scans/extract`)
- Create: `src/lib/log.ts` (structured cost log helper)
- Test: `src/providers/mock.test.ts`, `src/pipelines/scan-normalize.test.ts`, `src/routes/scans.test.ts`, `src/server.auth.test.ts`

### Provider interface (the seam the whole AI stack hangs off)
```ts
export interface AIProvider {
  readonly name: 'anthropic' | 'openai' | 'mock';
  generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResult<T>>;   // stub now, body in M4
  streamStructured<T>(req: StructuredRequest<T>): AsyncIterable<StreamEvent>;        // stub now, body in M4
  extractFromImage(req: AIImageExtractionRequest): Promise<AIImageExtractionResponse>; // implemented this milestone
}
```
`generateStructured`/`streamStructured` get real bodies in M4 — define the signatures now and throw `NOT_IMPLEMENTED` so the interface is stable. **Only `extractFromImage` is built in M3.**

### Tasks
- [ ] **B1 — scaffold + env + server.** `env.ts`: `PORT` (default 4001), `AI_SERVICE_TOKEN` (min 32), `DEFAULT_AI_PROVIDER` (`anthropic|openai|mock`, default `mock`), `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` optional, `DEFAULT_AI_MODEL`, `AI_FALLBACK_PROVIDER` optional. `server.ts`: Fastify with an `onRequest` hook that (a) requires `Authorization: Bearer ${AI_SERVICE_TOKEN}` on `/scans/*` (401 otherwise), (b) reads/generates `x-request-id` and binds it to the request log child. `/health` is unauthenticated. **Test `server.auth.test.ts`**: 401 without token, 200 `/health` without token. Run `pnpm install`.
- [ ] **B2 — mock provider (TDD first).** `mock.ts` returns a deterministic canned `ImageScanResult` (the board's 6–7 items: whole milk, butter, carrots, scallions, an "Unknown jar" at low confidence, etc.) so CI and the fidelity gate are reproducible. Test asserts the canned shape + a low-confidence item present.
- [ ] **B3 — normalization pipeline (TDD).** `scan-normalize.ts`: `normalizeScanIngredients()` coerces out-of-enum `unit`/`category`/`location` to safe fallbacks via an alias map (port the *idea* from v2's `scan-normalize.ts`, not the file — map onto **our** enums); `dedupeScanIngredients()` collapses by `normalizedName` (lowercased/singularized), merges confidence, sums same-unit quantities. **These are the roadmap's required "normalization unit tests."** Cover: tub→jar/ea alias, duplicate flour merge, quantity sum, confidence merge.
- [ ] **B4 — `/scans/extract` route (TDD).** Validates `AIImageExtractionRequest` (400 on bad input), calls `getProvider().extractFromImage()`, runs normalize→dedupe, returns `AIImageExtractionResponse`. On provider error, returns a valid empty result with a `reviewNotes` explanation (never 500 the caller) — mirror v2's resilience. Route test uses the mock provider via `app.inject`.
- [ ] **B5 — anthropic + openai providers.** `anthropic.ts`: `@anthropic-ai/sdk` Messages call with an image content block + a single forced `emit_pantry_items` tool (structured JSON output), `DEFAULT_AI_MODEL` (a current Claude model, e.g. a Sonnet-class vision model), `max_tokens` capped; extract the tool-use block → `ImageScanResult`; record `tokensUsed`. `openai.ts`: analogous via the `openai` SDK (image input + JSON schema / tool). `prompts/scans.ts` holds the system prompt + anti-hallucination rules (skip cookware/utensils; never identify by shape alone; receipt-abbreviation decoding; per-item confidence; dedup rule) ported from v2's intent. Lazily validate the needed API key inside each provider's constructor (so a mock-only dev never needs keys). **No live-call test in CI** — these are covered by manual smoke + typecheck.
- [ ] **B6 — `withFallback` decorator (TDD).** `with-fallback.ts` wraps `{ primary, fallback }`: try primary, on thrown error log + try fallback, surface a structured error if both fail. One decorator for the whole service (kills v2's duplicated adapters). Test with two mock providers (primary throws → fallback result returned; both throw → error). `providers/index.ts` composes `DEFAULT_AI_PROVIDER` + optional `AI_FALLBACK_PROVIDER` through it.
- [ ] **B7 — cost logging.** `lib/log.ts`: structured log line per extraction `{ requestId, provider, model, tokensIn, tokensOut, ms }`. Wire into the route. Run all gates; commit per task (`feat(ai): mock provider`, `feat(ai): scan normalization`, `feat(ai): /scans/extract route`, `feat(ai): anthropic+openai image extraction`, `feat(ai): withFallback + cost logging`).

---

# Slice C — DB: image_scans table + migration

**Files:**
- Create: `services/api/src/db/schema/scans.ts`
- Modify: `services/api/src/db/schema/index.ts` (barrel)
- Generated: `services/api/drizzle/0002_*.sql` + meta

### Tasks
- [ ] **C1 — schema.** `scanStatus` = `pgEnum('scan_status', SCAN_STATUSES)` (imported from `@pantry/contracts`). `imageScans` table: `id uuid pk`, `userId → users.id (cascade)`, `status scanStatus notNull`, `rawImageUrl text` (nullable, deferred), `result jsonb` (the `ImageScanResult`), `provider text`, `model text`, `tokensInput integer`, `tokensOutput integer`, `createdAt`/`updatedAt` timestamps with `$onUpdate`. Add to barrel.
- [ ] **C2 — generate + apply + typecheck.** `pnpm --filter @pantry/api db:generate` → `0002_*`; `podman compose up -d && pnpm --filter @pantry/api db:migrate && pnpm typecheck`. Commit `feat(api): image_scans schema + migration`.

---

# Slice D — API: scan router (extract + confirm-to-pantry) + AI client

**Files:**
- Create: `services/api/src/lib/ai-client.ts` (typed wrapper around the AI service)
- Create: `services/api/src/trpc/routers/scan.ts`
- Modify: `services/api/src/trpc/router.ts` (mount `scan`), `services/api/src/env.ts` (+`AI_SERVICE_URL`, `AI_SERVICE_TOKEN`), `services/api/src/server.ts`/`deps.ts` (inject the AI client), `infra/podman/compose.yaml` (api gains AI env)
- Test fixture: `services/api/test/fixtures/scan-sample.jpg` (tiny committed image)
- Test: `services/api/test/scan.integration.test.ts`

### Tasks
- [ ] **D1 — AI client + env.** `ai-client.ts`: `extractFromImage(req)` → `fetch(${AI_SERVICE_URL}/scans/extract)` with `Authorization: Bearer ${AI_SERVICE_TOKEN}` and the incoming `x-request-id`, parse the response with `AIImageExtractionResponse` (Zod). Add `AI_SERVICE_URL` (default `http://localhost:4001`) + `AI_SERVICE_TOKEN` to `env.ts`; thread into `AppDeps`/`createDeps`. Tests inject a fake AI client (no network).
- [ ] **D2 — `scan.extract` (TDD).** `protectedProcedure.input(AIImageExtractionRequest)`: insert an `image_scans` row `status:'processing'`; call `ctx.aiClient.extractFromImage`; update the row to `succeeded` (or `failed`) with `result` + `provider`/`model`/`tokens`; return `{ scanId, result }`. Integration test (fake AI returning the mock canned result) asserts the row is written and the items come back; UNAUTHORIZED without a session.
- [ ] **D3 — `scan.confirm` (TDD).** `protectedProcedure.input(confirmScanInput)`: in one transaction, verify the scan belongs to the user, bulk-insert the selected items into `pantry_items`, write an `inventory_events` `added` row per item (reuse the M2 create pattern), flip `image_scans.status → 'confirmed'`. Returns the created items. Test: confirm a 2-item subset → both appear in `pantry.list`; foreign scan → `NOT_FOUND`.
- [ ] **D4 — fixture-image integration test.** The roadmap's required end-to-end API test: POST the committed `scan-sample.jpg` (base64) through `scan.extract` with the **mock** AI provider wired, then `scan.confirm` → assert pantry reduced/grew correctly. Run all gates; commit `feat(api): scan extract + confirm-to-pantry router`.

> `packages/api-client` needs no change — `scan` is a sync tRPC router picked up via `AppRouter`. The SSE consumer is **M4** (streaming), explicitly out of scope here.

---

# Slice E — Mobile: 4-step camera scan flow (board §08)

Decompose aggressively — this is the v2 1,219-LOC cautionary tale. One state-machine hook + one component per step + small shared subcomponents, every file ≤200 lines.

**Files:**
- Add dependency: `expo-camera` (pinned exact — milestone-boundary upgrade is allowed).
- Create route group: `apps/mobile/src/app/(scan)/_layout.tsx` (stack/modal presentation) + `index.tsx` (composition-only → `<ScanFlowScreen/>`). Entry points: "Scan" buttons on Pantry/Inventory navigate here.
- Create: `apps/mobile/src/features/scan/strings.ts`, `useScanFlow.ts` (state machine: `viewfinder → detecting → review → added`, capture/extract/confirm via `api.scan.*`, selection + edit state), `useScanFlow.test.ts`
- Create components: `ScanFlowScreen.tsx` (switches on step), `ViewfinderStep.tsx`, `DetectingStep.tsx` + `DetectingOverlay.tsx`, `ReviewStep.tsx` + `ReviewRow.tsx`, `AddedStep.tsx`
- Create test asset/dev path: a "use sample image" intake behind a dev flag (no camera in simulator/CI), feeding a committed fixture image into the same `extract` path.

### Tasks
- [ ] **E1 — `useScanFlow` hook (TDD first).** State machine + transitions: `capture(asset)` → `detecting` → `extract` (calls `api.scan.extract`) → `review` with items mapped to draft rows (`selected = confidence ≥ 0.5`; low-confidence start unselected); `toggle(id)`, `editRow(id, patch)`, `addMissing()`; `confirm()` → `api.scan.confirm` with selected rows → `added`. Test transitions, default selection partition, confirm payload — all with a mocked `api` (mirror M2 hook tests).
- [ ] **E2 — strings.** All board copy: "Scan pantry", "Point at your open fridge or cupboard", "Detecting", "Found 7 items so far…", "Review scan"/"Found 6 things.", "Tap to edit or remove…", "+ Add something we missed", "Add 6 to pantry", "Pantry updated"/"Added 6 things.", "Your pantry now holds 14 items…", "3 new ideas ready", "See tonight's ideas", "View pantry". Formatters for the dynamic counts.
- [ ] **E3 — step components.** `ViewfinderStep`: `expo-camera` `CameraView` + permission gate + close/flash/flip chrome + reticle + shutter/gallery/flip controls (over a fixture background when no camera). `DetectingStep`/`DetectingOverlay`: blurred scene + sweep line + frosted loader card + animated progress bars (frozen for the mock-provider capture). `ReviewStep`/`ReviewRow`: editable checkbox list (name + qty·category·confidence%, pencil edit, low-confidence note, dimmed un-addable row) + sticky "Add N to pantry" footer. `AddedStep`: centered success badge + headline + "ideas ready" card (**stub CTA**) + "See tonight's ideas"/"View pantry" buttons. Reuse design-system native primitives (`Icon`, `Button`, `Card`, `BottomSheet` if a picker is needed, tokens). Add `testID`s for Maestro. Route files composition-only.
- [ ] **E4 — gates + commit** `feat(mobile): camera scan flow viewfinder→detecting→review→added (board §08)`.

---

# Slice F — Compose wiring + AI service in the stack

**Files:** `infra/podman/compose.yaml`, `.env.example`

### Tasks
- [ ] **F1 — add the `ai` service** to compose: build `services/ai/Containerfile`, env `AI_SERVICE_TOKEN`/`DEFAULT_AI_PROVIDER`/`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`DEFAULT_AI_MODEL`, port `4001:4001`. Give `api` `AI_SERVICE_URL=http://ai:4001` + the shared `AI_SERVICE_TOKEN`. Update `.env.example` with the new vars (no real secrets). Verify `podman compose up -d` boots all three (postgres, api, ai) and `/health` responds on the ai service. Commit `chore(infra): add ai service to compose`.

---

# Slice G — Fidelity gate + e2e + decisions + roadmap status

**Files:** `docs/checklists/m3-scan.md`, `docs/decisions.md`, `tools/design-fidelity/references/*` (committed), `e2e/mobile/scan.yaml`, roadmap Status table.

### Tasks
- [ ] **G1 — capture references** for the 4 §08 frames (`pnpm -C tools/design-fidelity capture:references`); verify the 4 slugs + manifest entries; commit `test(fidelity): capture M3 §08 reference frames`.
- [ ] **G2 — capture + compare mobile frames.** Drive the app to each step on the pinned simulator (status-bar override + frozen clock per M1/M2 method): Viewfinder (over fixture background), Detecting (frozen via the **mock provider** + a paused animation fixture), Review (mock canned items), Added (after a confirm). `xcrun simctl io screenshot` → pixelmatch report → iterate UI to faithful → record approval rows in `docs/checklists/m3-scan.md` (frame, reference file, date, pixelmatch %).
- [ ] **G3 — Maestro flow.** `e2e/mobile/scan.yaml`: launch → sign in → open scan → use the **dev sample-image** intake (no camera) → assert "Detecting" → assert "Found … things." review list → tap "Add to pantry" → assert "Added" success. Verify locally against Expo Go (CI execution deferred per M1/M2 precedent); note result in the checklist.
- [ ] **G4 — decisions + status.** Append to `docs/decisions.md` (newest first): (a) synchronous extract + persisted `image_scans`, no polling; (b) deferred blob storage / nullable `rawImageUrl`; (c) "Added" CTAs stubbed until M4; (d) camera-fidelity-over-fixture-background composition; (e) AI extraction reuses pantry enums + normalization coercion. Mark **M3 done** in the roadmap Status table and link this plan + `docs/checklists/m3-scan.md`. Final full sweep: `podman compose up -d && pnpm lint && pnpm typecheck && pnpm test && pnpm -r build`. Commit `docs: M3 complete; decisions logged; roadmap status updated`.

---

## Verification (end-to-end)

1. **Unit/contract:** `pnpm test` green — contracts scan DTO tests; AI service mock-provider + **normalization** + route + service-token-auth + withFallback tests; API `scan.extract`/`scan.confirm` + **fixture-image** integration tests; mobile `useScanFlow` hook tests.
2. **Types & lint:** `pnpm typecheck` (0 errors, all workspaces incl. new `services/ai`) and `pnpm lint` (`--max-warnings 0`, no `eslint-disable`/`any`). Every scan component ≤300 (target 200) LOC; route files composition-only — the explicit antidote to v2's monolith.
3. **Build:** `pnpm -r build` succeeds.
4. **DB:** `db:migrate` applies `0002_*` cleanly on a fresh DB; `image_scans` present.
5. **Service isolation:** AI service rejects unauthenticated `/scans/extract` (401); `/health` open; request IDs propagate API→AI in logs; a cost log line is emitted per extraction.
6. **Fidelity:** all 4 §08 frames approved in `docs/checklists/m3-scan.md` (Detecting frozen via mock provider).
7. **E2E:** Maestro `scan.yaml` verified locally (dev sample-image path); existing web/mobile e2e still green.
8. **Manual smoke:** `podman compose up` (with a real `ANTHROPIC_API_KEY` + `DEFAULT_AI_PROVIDER=anthropic`) → scan a fridge photo on device → review extracted items → confirm → items appear in pantry with `added` inventory events; flip to `DEFAULT_AI_PROVIDER=mock` → deterministic canned result, no keys needed.

## Self-review notes

- **Spec coverage:** every M3 roadmap bullet mapped — AI service with provider interface + anthropic/openai/mock + single `withFallback` + prompts/ + normalization pipelines + service-token auth + request IDs + cost logging (Slice B); image upload + scan lifecycle + confirm-to-pantry transaction (Slices C/D); mobile 4-step flow with each step its own component, extraction norms enforced (Slice E); gate = 4 frames (Detecting frozen via mock) + normalization unit tests + fixture-image integration test (Slices B3/D4/G).
- **One AI client, no duplication:** API consumes exactly one typed `ai-client.ts`; the service composes exactly one `withFallback` chain — directly fixing v2's duplicated adapters.
- **Enum consistency:** AI output is validated/coerced onto the existing M2 pantry enums; `confirmScanInput` reuses `createPantryItemInput`; `numeric`↔`number` boundary handled in the pantry insert reuse.
- **No new suppressions:** zero `eslint-disable`/`any`/`@ts-expect-error`; `generateStructured`/`streamStructured` are typed stubs (bodies in M4), not `any` placeholders.
- **Deferred to later milestones (intentionally):** SSE consumer + streaming bodies (M4); generation CTAs from the Added screen (M4); entitlement/quota gating on scan (M8); blob storage for raw images (post-M3 infra).
