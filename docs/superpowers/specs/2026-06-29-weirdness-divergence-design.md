# Weirdness divergence & band unification — design

**Date:** 2026-06-29
**Status:** Draft (awaiting review)

## Problem

The recipe-generation weirdness slider produces a **compressed curve**. Every
level reads as a mild variation of the "safe" version of the requested dish, and
even at maximum chaos the model only swaps or adds a single ingredient. The
reported example: "Lamb tagine" at full chaos returned a textbook tagine with
anise and pomegranate added — effectively normal/curious output from the top of
the scale.

Two root causes:

1. **The prompt describes posture, not measurable divergence.** `BAND_GUIDANCE`
   in `services/ai/src/prompts/recipes.ts` tells the model *how bold to feel* but
   never forces an *escalating, countable* amount of departure. With nothing
   mechanical to escalate, the model collapses every band toward the safe dish.
   (Note: temperature is not a usable lever here — the Anthropic provider uses
   extended thinking, which pins temperature to 1; OpenAI just takes the default.
   The fix is therefore entirely prompt-side and provider-agnostic.)

2. **Two divergent band systems.** The prompt uses a 5-band scheme from
   `@pantry/contracts` (`normal/curious/interesting/adventurous/chaotic`, cutoffs
   at 20/40/60/80). The UI uses a *separate* 4-label scheme in `design-system`
   (`normal/curious/adventurous/chaotic evil`, cutoffs at 25/55/85). At score 50
   the UI shows "curious" while the prompt calibrates to "interesting"; at 84 the
   UI shows "adventurous" while the prompt calibrates to "chaotic". The visible
   label does not match the band that actually drives output.

## Goals

- Make each weirdness band deliver a **measurably different, escalating** amount
  of divergence, so the slider's effect is legible end to end and the top of the
  scale is genuinely adventurous.
- **Unify the band system** into a single 5-band source of truth shared by the
  prompt and the UI, so the visible slider label always equals the band feeding
  the model.

## Non-goals

- No temperature / sampling-parameter changes (see root cause 1).
- No redesign of the slider's visual layout beyond rendering 5 tick words
  instead of 4. The design board is silent on the weirdness slider (it was
  composed from primitives — a logged decision in `docs/decisions.md`), so the
  band count is ours to choose.
- No change to the tweak flow, scan flow, or branch re-prompts.

## Decisions settled during brainstorming

- **Scope:** the whole curve feels compressed, not just the top end → recalibrate
  the entire scale, not only `chaotic`.
- **Approach:** scaled, quantified divergence requirement in the prompt
  (escalating departure-axis count per band) + a pre-emit self-audit. Chosen over
  a purely qualitative rewrite (the kind of language already present and
  underperforming) and over temperature scaling (unusable with thinking).
- **Label alignment:** align the UI labels with the prompt bands so the visible
  word matches the band driving output.
- **Band count:** keep all **5 bands** (`interesting` retained) for finer prompt
  gradation, which directly fights the compression complaint. The slider gains a
  5th tick word.

## Architecture

### Single source of truth: `@pantry/contracts`

The band cutoffs, ordering, and display labels are **domain knowledge** and live
in contracts. The existing duplication in `design-system` is the smell this fixes.

`packages/contracts/src/recipes/weirdness.ts` (extended):

- `weirdnessBand(score): WeirdnessBand` — unchanged 5-band mapping, cutoffs
  0–20 / 21–40 / 41–60 / 61–80 / 81–100. (`WEIRDNESS_BANDS` already exists in
  `recipes/enums.ts`.)
- `WEIRDNESS_BAND_LABELS: readonly string[]` — ordered display words for the
  slider tick row: `['normal', 'curious', 'interesting', 'adventurous', 'chaotic evil']`.
- `WEIRDNESS_BAND_LABEL: Record<WeirdnessBand, string>` — band → display word.
  Identity for every band except `chaotic` → `'chaotic evil'`.
- `weirdnessLabel(score): string` — `WEIRDNESS_BAND_LABEL[weirdnessBand(score)]`.

These are plain TypeScript (no zod at runtime), so consuming them carries no
meaningful bundle cost.

### UI consumes contracts

`design-system` takes a `"@pantry/contracts": "workspace:*"` dependency.

- `packages/design-system/src/shared/weirdness.ts` → thin re-export of
  `WEIRDNESS_BAND_LABELS` (as `WEIRDNESS_LABELS`), `weirdnessLabel`, and a
  `WeirdnessLabel` type, all sourced from contracts. The hardcoded 4-label list
  and 25/55/85 cutoffs are deleted.
- `packages/design-system/src/native/WeirdnessSlider/weirdness.ts` already
  re-exports `shared/weirdness.ts` — unchanged in shape, now carries 5 labels.
- Both sliders render the labels through `WEIRDNESS_LABELS.map(...)`, so the web
  vocab row and the native hidden-sizer slot pick up the 5th word automatically.
  The native "current word" slot sizes itself to the widest label — verify
  "chaotic evil" / "adventurous" still fit the reserved slot (they are the widest
  already-present words; "interesting" is narrower, so no new max).

**Fallback if `design-system` must stay contracts-free:** keep the band code in
`design-system` and add a test-only `devDependency` on contracts asserting parity
(identical cutoffs + labels). Primary recommendation is the real dependency; the
duplication is the bug. Flagged here for review veto.

### Escalating-divergence prompt: `services/ai/src/prompts/recipes.ts`

Rewrite `BAND_GUIDANCE` so each band names a **specific, escalating number of
departure axes**. Departure axes (defined once, reused): cuisine, technique,
flavor profile, hero ingredient, format, course, temperature, time of day.

| Band | Mandated divergence |
|------|--------------------|
| `normal` | 0 departures — canonical and conservative, on purpose. |
| `curious` | Exactly **1 small** move. An ingredient swap/addition is acceptable **only in this band**. |
| `interesting` | **1 full** departure on a meaningful axis — more than an ingredient swap. |
| `adventurous` | **2+** departures on **distinct** axes. |
| `chaotic` | **3+** departures on **distinct** axes, at least one subverting a *core expectation* of the dish (format, temperature, course, or cuisine identity). |

Additional prompt changes:

- **Global anti-pattern line:** "Adding, removing, or substituting a single
  ingredient is NOT a departure for any band above `curious`." (Today this floor
  only lives inside the `adventurous`/`chaotic` entries.)
- **Pre-emit self-audit:** before calling `emit_recipe`, the model must, in its
  thinking, list the axes it departed on and the count, confirm the count meets
  the current band's floor, and revise if it falls short. Provider-agnostic
  system-prompt text (Anthropic reasons in extended thinking; OpenAI in its tool
  call — the instruction nudges both).
- Keep `intensityCalibration` (floor/mid/ceiling) for intra-band gradation, so
  two scores in the same band still feel different.

The departure-axis vocabulary already partially exists in the "Brainstorming
discipline" line; consolidate so axes are named once and referenced by both the
brainstorm step and the per-band requirements.

## Data flow (unchanged)

`weirdness: number` (request) → `buildGenerationSystemPrompt(weirdness, …)` →
`weirdnessBand` → `BAND_GUIDANCE[band]` + `intensityCalibration` → system prompt
→ provider stream. The UI independently maps the same `number` through
`weirdnessLabel` for display; both now resolve through the same contracts module.

## Testing

Band *quality* is not unit-testable, so tests assert the **testable surface**:
the prompt text contains the required directives, and the band/label math is
correct.

- **contracts** (`weirdness` tests): cutoff boundaries for all 5 bands
  (0,20,21,40,41,60,61,80,81,100); `weirdnessLabel` returns the display word
  including `chaotic` → "chaotic evil"; `WEIRDNESS_BAND_LABELS` order and length.
- **services/ai** (`recipes` prompt-builder tests): for each band, the built
  prompt contains that band's escalating-divergence directive (e.g. chaotic
  mentions "3" distinct axes + core-expectation subversion); the global
  forbidden-single-ingredient line is present; the pre-emit self-audit
  instruction is present; `intensityCalibration` floor/mid/ceiling still emitted.
- **design-system**: update `WeirdnessControl.test.tsx` (already touched on this
  branch) and the web `WeirdnessSlider` test for **5** label words; assert
  `weirdnessLabel` at representative scores matches the shared source.

All three repo gates (`pnpm lint` / `pnpm typecheck` / `pnpm test`) must pass;
postgres must be up for the api suites per `CLAUDE.md`.

## Risks / open items

- **design-system → contracts dependency** (see fallback above) — the one
  reviewable judgment call.
- **Native current-word slot width** — confirm 5 sizers don't change the widest
  reserved width (expected: no, the widest words are unchanged).
- **`whySuggested` leakage** — the self-audit must stay in thinking; the existing
  "do not narrate tool plans in `whySuggested`" rule already guards this; keep it.
