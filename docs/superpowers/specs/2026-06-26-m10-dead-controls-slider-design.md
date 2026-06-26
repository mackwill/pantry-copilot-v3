# M10 — Dead controls audit + mobile slider fix (design)

> Spec for milestone M10. Two independent workstreams under one milestone:
> **A.** find and remediate every dead/disconnected interactive element across web,
> mobile, and the shared design system; **B.** fix the mobile WeirdnessSlider drag
> stutter. Audit-first: a committed inventory is reviewed before any remediation.

## Goal

The app has accumulated interactive elements (buttons, pressables, nav items, tabs,
cards, chips, list rows, icon buttons, links) that look clickable but do nothing —
empty handlers, stub comments, dead-end navigation, or affordances with no handler at
all. We will find them all, list them, decide per element whether to **wire** or
**remove**, and execute. Separately, the mobile `WeirdnessSlider` stutters while the
value changes; we will fix the underlying animation.

## Decisions (settled with user, 2026-06-26)

| Decision            | Choice                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Triage authority    | **Board is the arbiter.** Recommendation rule below; user adjudicates only genuine ambiguities.                    |
| Scope of "clickable" | **Everything interactive** — buttons, pressables, nav items, tabs, cards, chips, list rows, icon buttons, links. |
| Roadmap structure   | **New milestone M10** with a row in the Status table and its own plan file.                                        |
| Phasing             | **Audit first, then fix.** Phase 1 delivers a committed inventory doc reviewed before any code changes.            |
| Remediation tests   | **Unit/component tests sufficient** — no new e2e (Playwright/Maestro) required for wired controls.                 |

**Recommendation rule:** control exists in the design board and does something there
→ **wire**; control is not in the board → **remove**; in the board but its intended
behavior is ambiguous → **flag for user**.

Design bible: `/Users/mackmindenhall/Documents/pantry-copilot-v2/claudeDesignOutput/All Screens.html`.

## Workstream A — Dead-control audit & remediation

### What counts as "dead"

A control is dead if any of the following hold:

1. **Empty handler** — `onPress`/`onClick` is `() => {}`, `noop`, or assigned a handler
   whose body is empty.
2. **Stub handler** — handler exists but is annotated as a stub ("no-op for now",
   "M_ wires this", `/* placeholder */`) and produces no effect.
3. **Dead-end target** — handler runs but does nothing observable: navigates nowhere,
   opens no sheet/modal, performs no mutation, changes no state.
4. **Affordance without handler** — element looks pressable (cursor pointer,
   `role="button"`, `Pressable`/`TouchableOpacity` wrapper, link styling) but has no
   handler at all.
5. **Permanently disabled** — rendered `disabled` with no code path that can enable it.

Out of scope: controls that are *correctly* conditionally disabled (e.g. a submit
button disabled until a form is valid) — those are live.

### Procedure

Run per surface — web routes (`apps/web`), mobile routes (`apps/mobile`), and shared
primitives (`packages/design-system`):

1. **Enumerate** every interactive element via static scan: `onClick`, `onPress`,
   `role="button"`, `<button>`, `Pressable`/`TouchableOpacity`/`Touchable*`, `Link`/
   `<a>`/`router.*`, plus an affordance grep (`cursor: pointer`, `accessibilityRole`).
2. **Trace** each handler to a concrete effect: navigation, data mutation, sheet/modal
   open, local state change, or external call. Following the handler through props is
   required — a control that calls an `onChange` prop is only live if *some* parent
   passes a real handler.
3. **Classify** each: `Live` / `Disconnected` / `Should-remove` / `Ambiguous`.
4. **Cross-reference the board:** does this control exist in `All Screens.html`, and
   does it do something there? Apply the recommendation rule.
5. **Record** in the inventory table.

### Deliverable: inventory doc

`docs/audits/2026-06-26-dead-controls.md`, committed at the end of Phase 1. One row per
dead control:

| Surface | File:line | Control | Current behavior | Board says | Recommendation | Notes |
| ------- | --------- | ------- | ---------------- | ---------- | -------------- | ----- |

- `Surface` ∈ {web, mobile, design-system}.
- `Board says` = whether/what the control does on the design board.
- `Recommendation` ∈ {wire, remove, keep, **flag**}.
- A short summary above the table: counts per surface and per recommendation, and a
  dedicated **"Needs your decision"** section listing every `flag` row.

The doc is reviewed by the user. Ambiguous (`flag`) rows are resolved into
`wire`/`remove` before Phase 2 begins.

### Remediation (Phase 2)

After inventory sign-off, execute in small commits grouped by surface:

- **Wire:** connect the control to its board-defined behavior (navigation via existing
  router patterns, mutation via existing api-client/tRPC hooks, or sheet/modal via the
  canonical `BottomSheet`). Each wired control gets a unit/component test asserting the
  handler fires the intended effect.
- **Remove:** delete the element and any now-unreachable code, handlers, and
  per-feature `strings.ts` entries it owned. Verify no remaining references.
- **Keep/flag-resolved:** apply the user's adjudication.

TDD throughout (test first for each wired control). Frequent commits.

## Workstream B — Mobile WeirdnessSlider stutter

### Root cause

`packages/design-system/src/native/WeirdnessSlider/SliderTrack.tsx` positions the thumb
with a percentage-string interpolation:

```ts
const thumbLeft = thumbAnim.interpolate({
  inputRange: [0, 100],
  outputRange: ['0%', '100%'],
});
// ...
<Animated.View style={[styles.thumb, { left: thumbLeft, ... }]} />
```

Animating a **layout property (`left`) as a percentage string cannot use the native
driver** and forces a JS-thread **layout** pass on every `setValue` call. During a drag
(`onResponderMove` fires `thumbAnim.setValue` continuously) this produces a relayout per
frame, which stutters — especially on Hermes/lower-end devices. The M7 "Animated-driven
thumb" change removed the prop round-trip but left the percentage-layout cost in place,
so the stutter persists.

### Fix

The track width is already measured into `trackWidthRef` via `onLayout`. Drive the thumb
with a pixel **`transform: [{ translateX }]`** instead of `left`:

- Interpolate `thumbAnim` (0–100) to a pixel offset using the measured track width
  (`0 → trackWidth`), accounting for the existing thumb centering.
- Use `useNativeDriver: true` so the thumb glides on the UI thread, off the JS thread
  entirely.
- Keep the existing `draggingRef` guard (don't let a stale round-tripped `value` prop
  fight imperative updates mid-drag) and the a11y increment/decrement actions.
- Handle first-paint before `onLayout` (trackWidth = 0) gracefully — re-derive the
  interpolation once width is known.

This is shared by both `WeirdnessSlider` and `WeirdnessControl`, so both benefit.

### Tests

- Existing `WeirdnessSlider.test.tsx` / `WeirdnessControl.test.tsx` continue to pass.
- Add a regression test asserting the thumb is positioned via `transform`/`translateX`
  (not percentage `left`) and that drag updates do not require a parent re-render to move
  the thumb.

## Execution shape & gates

- **Phase 1 — Audit:** enumerate → trace → classify → board cross-reference → commit
  inventory doc → **user review gate** (resolve all `flag` rows).
- **Phase 2 — Remediation:** wire/remove per adjudicated inventory, small commits by
  surface, unit/component test per wired control, strings cleanup on removals.
- **Phase 3 — Slider fix:** transform-based thumb + native driver + regression test.
  Independent of A; can land in parallel.
- **Gates (every commit claiming completion):** `pnpm lint` (`--max-warnings 0`, no
  `eslint-disable`, no `any`), `pnpm typecheck`, `pnpm test` all green. No new dead
  controls introduced. Slider verified on device/simulator.
- **Roadmap:** add the M10 row to the Status table; plan file at
  `docs/superpowers/plans/2026-06-26-m10-dead-controls-slider.md`.

## Non-goals

- No e2e (Playwright/Maestro) additions for wired controls.
- No design/board changes — the board is authoritative; we conform the app to it.
- No unrelated refactors beyond removing code made dead by a removal.
- No new screens or features; building a not-yet-designed screen (e.g. Shopping) is out
  of scope — a control pointing at such a screen is `flag`/`remove`, not `wire`.
