# Pantry CoPilot v3 — Greenfield Rewrite Roadmap

> **Resume instructions for a fresh session:** Read this file top to bottom, then open the
> "Status" section below to find the current milestone. The detailed plan for the current
> milestone lives in `docs/superpowers/plans/`. Execute it with the
> superpowers:executing-plans skill. When a milestone finishes, mark it done in Status,
> write the next milestone's detailed plan (superpowers:writing-plans) using this roadmap
> as the spec, and continue.

## Status

| Milestone                                        | State           | Detailed plan                                                    |
| ------------------------------------------------ | --------------- | ---------------------------------------------------------------- |
| M0 — Scaffold + design system + fidelity harness | done            | `docs/superpowers/plans/2026-06-10-m0-scaffold-design-system.md` |
| M1 — Auth + app shells                           | done            | `docs/superpowers/plans/2026-06-11-m1-auth-app-shells.md` — completed 2026-06-13; both §00 login frames approved (`docs/checklists/m1-auth.md`) |
| M2 — Pantry core (manual entry)                  | impl complete · fidelity review pending | `docs/superpowers/plans/2026-06-13-m2-pantry-core.md` — all automated gates + web e2e green; references captured, screenshot approval pending (`docs/checklists/m2-pantry.md`) |
| M3 — AI service v1 + camera scan                 | impl complete · fidelity review pending | `docs/superpowers/plans/2026-06-14-m3-ai-service-camera-scan.md` — all automated gates green; AI service (mock/anthropic/openai + withFallback), scan extract/confirm, mobile §08 flow; references captured, screenshot approval pending (`docs/checklists/m3-scan.md`) |
| M4 — Home + generation + result                  | done | `docs/superpowers/plans/2026-06-14-m4-home-generation-result.md` — contracts/AI/DB/API/SSE-spike + web & mobile Home/Thinking/Drafting/Result; all 10 §01/§04/§02 frames approved (`docs/checklists/m4-generation.md`); web + mobile (Maestro) e2e verified locally. RN SSE via `react-native-sse` ponyfill; decisions logged |
| M5 — Recipe library + detail                     | impl complete · fidelity review pending | `docs/superpowers/plans/2026-06-15-m5-recipe-library-detail.md` — all automated gates green (contracts/API/web/mobile tests, lint, typecheck, build); `recipe_favorites` + migration 0004; web `/recipes` + `/recipes/$id` + live favorites; mobile Cook→library, Home←generation, `NewAskSheet`, recipe detail; e2e specs added (`e2e/web/specs/library.spec.ts`, `e2e/mobile/library.yaml`). References captured; screenshot approval pending (`docs/checklists/m5-library.md`); decisions logged |
| M6 — Cook sessions + consume flow                | impl complete · fidelity review pending | `docs/superpowers/plans/2026-06-16-m6-cook-sessions-consume-flow.md` — all automated gates green (contracts/utils/AI/API integration/web + mobile tests, lint, typecheck, `-r build`); persisted resumable `cook_sessions` + consume transaction (migrations 0005/0006), structured recipe steps, animated BottomSheet, web stove in-session + mobile dark stove + resume + end-of-cook + consume sheet; design doc `docs/design/cook-sessions.md`; web e2e `cook.spec.ts` verified locally + Maestro `cook.yaml`; references/screenshot approval pending (`docs/checklists/m6-cook-sessions.md`); decisions A–G logged |
| M7 — Chat against a recipe                       | impl complete · fidelity review pending | `docs/superpowers/plans/2026-06-16-m7-recipe-chat.md` — all automated gates green (contracts/utils reducer/AI tweak emitter+orchestrator/API tweak integration/web component+hook/mobile hook tests, lint, typecheck, `-r build`); mutate-in-place versioning (`version` + frozen `original_snapshot`) + append-only `recipe_tweaks` (migration 0007), `streamTweak` provider path + `POST /recipes/tweak/stream`, shared `@pantry/utils` tweak reducer, web `?chat` co-pilot panel + live doc, mobile chat sheet + FAB; web e2e `recipe-chat.spec.ts` verified locally (tweak→persist→revert) + Maestro `recipe-chat.yaml`; references/screenshot approval pending (`docs/checklists/m7-recipe-chat.md`); decisions logged. Also fixed the mobile WeirdnessSlider drag stutter (Animated-driven thumb) |
| M8 — Monetization                                | impl complete · fidelity review pending | `docs/superpowers/plans/2026-06-17-m8-monetization.md` — all automated gates green (contracts/api-client/API/web/mobile tests, lint, typecheck, `-r build`); weekly quota gate (reset Sunday 00:00 UTC) + three-tier `free/basic/pro` entitlement mirror with derived `isPro` + idempotent RC webhook (dedupe on `event.id`) + entitlement gate on generation/scan (recipe quota counts `source='ai'`, scan quota counts every `image_scans` row) + top-up credit ledger (grants − consumptions); migrations 0008/0009. Web paywall editorial/compare + limit-hit modal + trial-ending page + Settings subscription rows; mobile paywalls A/B + limit-hit sheet + pre-trial offer/trial-ending + Settings subscription section + manage. RevenueCat behind `VITE_REVENUECAT_WEB_BILLING_KEY` (web) / lazy-guarded native SDK that no-ops in Expo Go (dev build/EAS for real purchases); web e2e `e2e/web/specs/paywall.spec.ts` (limit-hit → paywall → unlock) + Maestro `e2e/mobile/paywall.yaml` added; references/screenshot approval pending (`docs/checklists/m8-monetization.md`); decisions logged |
| M9 — Hardening + launch readiness                | not started     | —                                                                |

## Context

Pantry CoPilot v2 (`/Users/mackmindenhall/Documents/pantry-copilot-v2`) drifted from its designs and accumulated bad practices: 1,200-line screen files, ~944 eslint-disables, ~185 `any` types, zero web tests, inconsistent bottom-sheet usage, security gaps (open AI service port, dev auto-login), and incomplete i18n. Meanwhile the design assets are production-grade: `claudeDesignOutput/All Screens.html` (Kitchen OS v1.4) is an interactive board composing ~50 labeled screen states across 18 sections.

**Goal:** rebuild everything from scratch in this repo (`pantry-copilot-v3`), exactly matching the design board, with engineering standards that prevent the v2 mess from recurring. v2 is reference-only — consult, never copy.

## Decisions (settled with user, 2026-06-10)

| Decision      | Choice                                                                                                                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope         | Full greenfield rewrite: web, mobile, API, AI service, DB schema                                                                                                                                                                                                                          |
| Stack         | Same as v2, latest pinned versions: pnpm monorepo · TanStack Start + React (web) · Expo/expo-router (mobile) · Fastify + tRPC + Drizzle + PostgreSQL + Better Auth (API) · separate AI service (Anthropic primary, OpenAI fallback) · CSS Modules + tokens · Vitest + Playwright · Podman |
| Features      | Everything, including subscriptions/paywalls (RevenueCat)                                                                                                                                                                                                                                 |
| Design bible  | `pantry-copilot-v2/claudeDesignOutput/All Screens.html` — the v1.4 board (composes all screen JSX incl. home-cook-v2, paywalls, consume flow, recipe chat)                                                                                                                                |
| Data          | Fresh database, no migration from v2                                                                                                                                                                                                                                                      |
| Sequencing    | Design system first, then vertical slices (one board section group at a time)                                                                                                                                                                                                             |
| Fidelity gate | Per-screen screenshot comparison against the rendered board before a screen is "done"                                                                                                                                                                                                     |
| Brand         | Kitchen OS only (Cookbook variant stays archived in v2)                                                                                                                                                                                                                                   |
| Web payments  | RevenueCat Web Billing                                                                                                                                                                                                                                                                    |
| i18n          | Strings must be translated from the get go. No hardcoded user facing strings. literals                                                                                                                                                                                                    |

## Monorepo structure

```
pantry-copilot-v3/
├─ apps/web/                 # TanStack Start SSR app, CSS Modules
├─ apps/mobile/              # Expo + expo-router iOS/Android app
├─ services/api/             # Fastify + tRPC + Drizzle + Better Auth — owns all business data
├─ services/ai/              # Fastify REST + SSE — stateless prompt orchestration, provider fallback
├─ packages/contracts/       # Zod schemas: DTOs, enums, AI stream-event unions (source of truth)
├─ packages/api-client/      # Typed tRPC client + SSE consumer, shared web/mobile
├─ packages/design-system/   # Tokens (CSS vars + generated RN mirror), web + RN primitives, icons
├─ packages/config/          # Shared tsconfig, eslint flat config, zod-validated env loader
├─ packages/utils/           # Pure helpers: expiration ranking, normalization, quantity math
├─ tools/design-fidelity/    # Playwright harness: serve board, capture reference frames, diff vs app
├─ e2e/web/  e2e/mobile/     # Playwright specs · Maestro flows + simulator screenshots
├─ infra/podman/             # compose.yaml (postgres, api, ai, web); Containerfiles in each service
├─ docs/                     # architecture.md, decisions.md, per-slice screen checklists
└─ .github/workflows/        # CI from day one: lint → typecheck → test → build
```

Architecture: `web/mobile —tRPC→ api —REST+SSE (service token)→ ai —→ Anthropic | OpenAI`, postgres behind api. AI service is authenticated and network-isolated (fixes v2's open port). All streaming events are Zod discriminated unions in `contracts`.

DB schema (fresh, informed by v2 `services/api/src/db/schema.ts`): Better Auth tables, `user_preferences`, `pantry_items`, `inventory_events`, `image_scans`, `recipes`, `recipe_tweaks`, `recipe_favorites`, `recipe_generation_jobs`, **`cook_sessions` (net-new — v2 never persisted these)**, `user_subscriptions`, `revenuecat_webhook_events`, credit grants/consumptions.

## Milestones

Every feature milestone follows: **contracts → DB/API → AI (if any) → web UI → mobile UI → screenshot gate → e2e smoke**.

### M0 — Scaffold + design system + fidelity harness

- git init; pnpm workspaces; `packages/config` (strict tsconfig, eslint flat config, prettier); Vitest/Playwright wiring; GitHub Actions CI; Podman compose with postgres + Containerfile stubs; `.env.example`.
- Port `claudeDesignOutput/design-system/tokens.css` verbatim into design-system; **generate** `tokens/native.ts` for RN from the CSS source (v2 maintained two copies by hand).
- Port primitives faithfully from `claudeDesignOutput/components/primitives.jsx`, `web-shell.jsx`, `nl-prompt.jsx`, `bottom-sheet.jsx`: Button, Card, Badge/Chip, Field/Input, Eyebrow, Tabs, **one canonical BottomSheet** (web + RN), WebShell, MobileTabBar, WeirdnessSlider, skeletons/empty states, icons.
- Build `tools/design-fidelity` (workflow below).
- **Gate:** CI green; primitives gallery screenshot-matches board equivalents; `podman compose up` boots.

### M1 — Auth + app shells (board §00)

- Better Auth (Google OAuth, magic link, expo plugin — reference v2 `services/api/src/auth/instance.ts`); Drizzle migrations; helmet + rate limits + CORS **now**; tRPC init; `/health` `/ready`. No dev auto-login (dev convenience = seeded magic link behind explicit dev flag, excluded from builds).
- Web shell + `Web · Login`; expo-router tab skeleton + `Mobile · Login`.
- **Gate:** 2 login frames matched; e2e sign-in; API integration tests vs ephemeral postgres in CI.

### M2 — Pantry core, manual entry (board §05 inventory, §06, §07, §09, §09.5, §10 shells)

- Contracts + API: pantry CRUD, category/location/unit enums, inventory event log, expiration ranking (pure logic in `packages/utils`, unit-tested).
- Web: Inventory, Ingredient form, Account (subscription rows stubbed).
- Mobile: Pantry with tap-to-cook selection tray, Add/Edit ingredient, Category/Location/Best-by picker sheets (all on canonical BottomSheet), Account shell.
- **Gate:** ~11 frames matched; CRUD integration tests; web e2e add→edit→delete.

### M3 — AI service v1 + camera scan (board §08)

- AI service stood up properly: provider interface (`generateStructured` / `streamStructured` / `extractFromImage`), `anthropic.ts` / `openai.ts` / `mock.ts` implementations, single `withFallback` decorator, prompts in `prompts/`, normalization in `pipelines/`, service-token auth, request IDs, cost logging. (Kills v2's duplicated adapters; the API service consumes exactly one AI client via `packages/api-client`.)
- API: image upload, scan job lifecycle, confirm-to-pantry transaction.
- Mobile: 4-step flow Viewfinder → Detecting → Review → Added (expo-camera), each step its own route/component — this is the screen that hit 1,219 LOC in v2; enforce extraction norms hard.
- **Gate:** 4 frames matched (Detecting frozen via mock provider); normalization unit tests; fixture-image integration test.

### M4 — Home + generation + result (board §01, §04, §02)

- Contracts: generation request (prompt, pantry chips, weirdness 0–100), full streaming event union, recipe DTO, 4 branch-chip actions. Reference v2 `contracts/src/ai/events.ts`, `weirdness.ts`.
- AI: streaming pipeline with two beats — thinking (prose + tool events) then drafting (recipe streams top→bottom). Reference v2 `providers/stream-orchestrator.ts`, `recipe-partial-emitter.ts`, `prompts/recipes.ts`.
- **Early spike:** SSE through TanStack Start/Nitro proxy layers (classic buffering failure mode) — testable via mock-provider event tape.
- Web: Home (NL prompt), Thinking, Drafting, Result (+4 re-prompt tiles). Mobile: Home, Home·selecting, Home·browse-pantry sheet, both generating beats, Result (2×2 branch grid).
- **Gate:** ~10 frames matched (streaming states frozen via scripted event tape); orchestrator unit tests incl. abort/error/fallback; e2e prompt→stream→result.

### M5 — Recipe library + detail (board §03 library, §05/§07 recipe detail)

- Library queries + favorites; Web Cook·empty + Recipe detail; Mobile Cook·default, New-tapped (NewAskSheet), Recipe detail incl. inline pantry block (frame ★-1).
- **Gate:** ~6 frames matched; e2e generate→library→detail→favorite.

### M6 — Cook sessions + consume flow (board §03.5, §03 resume, §★)

- Short design doc first (net-new, no v2 precedent): session state machine, timers, resume semantics.
- Persisted resumable `cook_sessions`; consume transaction → pantry deductions + inventory events.
- Web Cook·in-session (dark stove theme via token overrides, not ad-hoc colors); Mobile in-session, resume banner, End-of-cook ask, Consume sheet (editable quantities).
- **Gate:** ~6 frames matched; deduction math unit tests; e2e start→kill/reopen→resume→finish→consume→pantry reduced.

### M7 — Chat against a recipe (board §✦)

- Tweak stream pipeline (reference v2 `prompts/recipe-tweak.ts`, `providers/tweak-stream.ts`); `recipe_tweaks` lineage.
- Web: entry chips + slide-in chat panel (recipe stays live). Mobile: floating chat button + chat bottom sheet — decomposed from day one (message list / composer / diff summary / apply bar + `useRecipeChat` hook; v2's 852-LOC sheet is the cautionary tale).
- **Gate:** 4 frames matched; e2e tweak→summary→applied version persisted.

### M8 — Monetization (board §11–§15)

- RevenueCat: mobile via react-native-purchases, **web via RevenueCat Web Billing**. Webhook ingestion (idempotent, signature-verified — reference v2 `modules/subscription/*`, `docs/revenuecat-e2e-testing.md`); entitlement middleware on generation/scan; usage counters; trial lifecycle; top-up credits.
- Screens: Paywall A (editorial), Paywall B (ledger), contextual limit-hit modal/sheet, pre-trial offer, trial-ending (mobile + web), settings subscription rows (free/trial/pro), manage subscription.
- **Gate:** ~13 frames matched; webhook fixture tests; e2e limit-hit→paywall→sandbox purchase→unlock.

### M9 — Hardening + launch readiness

- Full e2e regression green in CI; security pass (CSP audit, rate-limit tuning, dep audit, secret scanning); observability (structured logs, end-to-end request IDs, AI cost logging); EAS build profiles; production Containerfiles + compose; accessibility/performance passes; **final full-board screenshot sweep**.

## Engineering standards (CI-enforced from M0)

- **Types:** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; `no-explicit-any: error`.
- **Zero-suppression:** `eslint-disable` comments banned repo-wide (eslint-comments plugin); rare exceptions via reviewed allowlist (<10 total). `--max-warnings 0`.
- **Component size:** eslint `max-lines` error at 300 (target 200); route files composition-only (<100 lines). Pattern: `routes/x.tsx` + `features/x/components/*` + `features/x/useX.ts` + `x.module.css`. State machines live in hooks/reducers, never inline JSX.
- **Tests per slice (merge requirement):** contracts schema tests; API integration tests vs ephemeral postgres; AI unit tests with mock provider (no live calls in CI); web Testing Library + Playwright happy path (**a slice without web tests does not merge**); mobile hook tests + one Maestro flow.
- **Strings:** typed `strings.ts` per feature; `react/jsx-no-literals` in app code.
- **Security from M0/M1, not M9:** helmet, rate limits, AI service auth, no dev auto-login, zod-validated env fail-fast, Containerfiles day one.
- **Process:** TDD per superpowers:test-driven-development; frequent commits; verification before claiming completion.

## Screenshot fidelity workflow (tools/design-fidelity)

1. Serve `claudeDesignOutput/` statically; vendor the board's CDN deps (React 18 UMD + Babel standalone) so CI is hermetic.
2. **Reference capture (once per board version, committed):** Playwright opens `All Screens.html`, locates frames via `.frame-label` text (mobile frames also have `data-screen-label`), screenshots `.web-body` (1280×860) or the IOSDevice element (390×800).
3. **App capture:** web via Playwright at 1280×860 with mock-data fixtures matching board content; mobile via `xcrun simctl io screenshot` on a pinned device with `simctl status_bar override` and frozen clock fixtures.
4. **Compare:** generate a side-by-side HTML report (reference | actual | pixelmatch diff) per screen. Gate = human approval of the report (layout/spacing/type/color fidelity, not pixel-identity); pixelmatch threshold acts as a regression tripwire on already-approved screens.
5. Approval recorded in the slice checklist in `docs/`.

Where the board is silent (error states, transient states), compose strictly from existing primitives and record the decision in `docs/decisions.md` — never invent new visual language.

## Key v2 reference files (consult, never copy)

All paths relative to `/Users/mackmindenhall/Documents/pantry-copilot-v2/`:

- `claudeDesignOutput/All Screens.html` + `claudeDesignOutput/design-system/tokens.css` + `claudeDesignOutput/components/*.jsx` — canonical design source
- `services/api/src/db/schema.ts` — schema reference
- `services/api/src/auth/instance.ts` — Better Auth config reference
- `services/ai/src/providers/stream-orchestrator.ts`, `recipe-partial-emitter.ts`, `prompts/*` — streaming reference
- `packages/contracts/src/ai/events.ts`, `weirdness.ts` — event vocabulary starting point
- `services/api/src/modules/subscription/*`, `docs/revenuecat-e2e-testing.md` — monetization reference
- `GAP_ANALYSIS.md`, `BugList.md` — anti-checklist of what must not recur

## Risks

1. **SSE through TanStack Start/Nitro** — spike at M4 start; mock event tape de-risks.
2. **Simulator screenshot determinism** — pinned device, status-bar override, frozen clocks.
3. **Version churn** (TanStack Start, Expo) — pin exact versions at M0; upgrade only at milestone boundaries.
4. **Cook sessions are net-new** — short design doc before M6 contracts.
5. **Board gaps for transient/error states** — primitives-only composition rule + decisions log.

## Verification (overall)

- Per slice: lint/typecheck/test in CI + screenshot report approved + e2e happy path green.
- Per milestone: `podman compose up` boots full stack; milestone's board frames all approved.
- M9: full-board sweep — every one of the ~50 frames re-verified against the committed reference captures.
