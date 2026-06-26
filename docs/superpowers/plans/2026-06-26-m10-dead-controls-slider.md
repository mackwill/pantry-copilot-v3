# M10 — Dead Controls Audit + Mobile Slider Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find every dead/disconnected interactive element across web, mobile, and the shared design system; per the design board, wire it up or remove it; and fix the mobile WeirdnessSlider drag stutter.

**Architecture:** Two independent workstreams. **A (Phases 1–2):** an audit-first sweep — Phase 1 enumerates and traces every interactive control into a committed inventory doc reviewed by the user; Phase 2 remediates each inventory row (wire to its board behavior, or delete it + its dead code/strings) one surface at a time. **B (Phase 3):** replace the WeirdnessSlider thumb's percentage-string `left` animation (which forces a JS-thread layout per frame) with a compositor-only `transform: translateX` in pixels off the measured track width.

**Tech Stack:** TanStack Start + React (web), Expo + expo-router + React Native (mobile), shared `@pantry/design-system` primitives (react-native + react-native-web), Vitest, react-native-svg, expo-router navigation, tRPC via `@pantry/api-client`.

## Global Constraints

- No `eslint-disable` comments anywhere. No `any` types. Lint runs with `--max-warnings 0`.
- Components ≤300 lines (target 200); route files are composition-only.
- User-facing strings live in per-feature `strings.ts` modules — never inline JSX literals. Removing a control means removing the `strings.ts` entries it solely owned.
- TDD for all code changes: failing test first, then implementation. Frequent commits.
- Pin exact dependency versions (`.npmrc` `save-exact=true`). This milestone adds **no** new dependencies.
- Design bible: `/Users/mackmindenhall/Documents/pantry-copilot-v2/claudeDesignOutput/All Screens.html`. The board is authoritative; conform the app to it, never the reverse.
- Gates before any commit claiming completion: `pnpm lint`, `pnpm typecheck`, `pnpm test` all green.
- Recommendation rule (workstream A): control does something on the board → **wire**; not on the board → **remove**; on the board but intended behavior ambiguous → **flag** for user.

---

## Phase 1 — Audit (investigation → committed inventory → review gate)

Phase 1 produces `docs/audits/2026-06-26-dead-controls.md`. These tasks are investigation + documentation, not code, so they have no failing-test cycle; the deliverable is the committed inventory. Do NOT change any app code in Phase 1.

### Task 1: Scaffold the inventory doc

**Files:**
- Create: `docs/audits/2026-06-26-dead-controls.md`

- [ ] **Step 1: Create the doc with its fixed structure**

Write exactly this skeleton (fill the tables in later tasks):

```markdown
# Dead controls inventory — 2026-06-26 (M10)

Source of truth for the M10 dead-controls remediation. A control is "dead" if it is
interactive (or looks interactive) but produces no observable effect. See
`docs/superpowers/specs/2026-06-26-m10-dead-controls-slider-design.md` for the full
definition and the wire/remove recommendation rule.

## Summary

- Web: <N> dead controls (<wire> wire / <remove> remove / <flag> flag)
- Mobile: <N> dead controls (<wire> wire / <remove> remove / <flag> flag)
- Design-system: <N> dead controls (<wire> wire / <remove> remove / <flag> flag)

## Needs your decision (flag rows)

<one bullet per `flag` row: file:line — control — why it's ambiguous — the options>

## Web (`apps/web`)

| File:line | Control | Current behavior | Board says | Recommendation | Notes |
| --------- | ------- | ---------------- | ---------- | -------------- | ----- |

## Mobile (`apps/mobile`)

| File:line | Control | Current behavior | Board says | Recommendation | Notes |
| --------- | ------- | ---------------- | ---------- | -------------- | ----- |

## Design system (`packages/design-system`)

| File:line | Control | Current behavior | Board says | Recommendation | Notes |
| --------- | ------- | ---------------- | ---------- | -------------- | ----- |
```

- [ ] **Step 2: Commit**

```bash
git add docs/audits/2026-06-26-dead-controls.md
git commit -m "docs(m10): scaffold dead-controls inventory"
```

### Task 2: Enumerate + classify web controls

**Files:**
- Modify: `docs/audits/2026-06-26-dead-controls.md` (Web section)

- [ ] **Step 1: Enumerate every interactive web element**

Run each scan and collect hits (read each hit's surrounding code, do not just paste the grep):

```bash
cd apps/web
grep -rnE 'onClick|role="button"|<button|<a |href=|navigate\(|router\.|<Link' src --include='*.tsx'
grep -rniE 'cursor: ?pointer' src --include='*.module.css'
```

- [ ] **Step 2: Trace each handler to a concrete effect**

For every hit, follow the handler to its effect: navigation (TanStack `Link`/`navigate`), a mutation (tRPC hook from `@pantry/api-client`), a sheet/modal open, or a local state change. A control that only calls an `onX` prop is live **only if a parent passes a real handler** — trace upward. Mark each: `Live`, `Disconnected`, `Should-remove`, or `Ambiguous`. Drop `Live` controls.

- [ ] **Step 3: Cross-reference the board and record rows**

For each non-`Live` control, open `All Screens.html`, find the matching screen/control, and note whether it does something there. Apply the recommendation rule. Add one table row per dead control to the Web section with `File:line · Control · Current behavior · Board says · Recommendation · Notes`. For any `flag`, also add a "Needs your decision" bullet.

- [ ] **Step 4: Commit**

```bash
git add docs/audits/2026-06-26-dead-controls.md
git commit -m "docs(m10): inventory web dead controls"
```

### Task 3: Enumerate + classify mobile controls

**Files:**
- Modify: `docs/audits/2026-06-26-dead-controls.md` (Mobile section)

- [ ] **Step 1: Enumerate every interactive mobile element**

```bash
cd apps/mobile
grep -rnE 'onPress|Pressable|Touchable|accessibilityRole="button"|router\.|<Link|useRouter' src --include='*.tsx'
```

- [ ] **Step 2: Trace each handler to a concrete effect**

Same tracing/classification as Task 2 Step 2, using expo-router (`router.push`/`router.back`), tRPC hooks, BottomSheet opens, or local state as the "live" effects. Known examples to confirm and record: `src/features/pantry/components/PantryScreen.tsx:68` (`CookTray onCook` is a `/* no-op stub */`), `src/features/ingredient/sheets/LocationSheet.tsx` ("Add a place" is a no-op). The header `Search` and `SlidersHorizontal` icons in `PantryScreen.tsx:30-31` are plain `Icon`s with no `Pressable` wrapper — record them as "affordance without handler" if the board shows them acting.

- [ ] **Step 3: Cross-reference the board and record rows**

As Task 2 Step 3, into the Mobile section.

- [ ] **Step 4: Commit**

```bash
git add docs/audits/2026-06-26-dead-controls.md
git commit -m "docs(m10): inventory mobile dead controls"
```

### Task 4: Enumerate + classify design-system controls + finalize summary

**Files:**
- Modify: `docs/audits/2026-06-26-dead-controls.md` (Design system section + Summary)

- [ ] **Step 1: Enumerate shared primitives that own controls**

```bash
cd packages/design-system
grep -rnE 'onPress|onClick|Pressable|role="button"' src --include='*.tsx'
```

Record only primitives where the dead behavior lives in the primitive itself (e.g. a built-in button with no `onPress` prop forwarded). A primitive that correctly forwards `onPress` and is merely passed a dead handler by a consumer belongs in that consumer's surface row, not here.

- [ ] **Step 2: Record rows + fill the Summary counts and "Needs your decision" list**

Add design-system rows, then fill the Summary section's per-surface counts and the "Needs your decision" bullets across all three surfaces.

- [ ] **Step 3: Commit**

```bash
git add docs/audits/2026-06-26-dead-controls.md
git commit -m "docs(m10): inventory design-system dead controls; finalize summary"
```

### Task 5: User review gate

- [ ] **Step 1: Present the inventory for review**

Tell the user: "Inventory complete at `docs/audits/2026-06-26-dead-controls.md`. Please review, and resolve every row in the 'Needs your decision' section to `wire` or `remove`."

- [ ] **Step 2: Apply adjudications**

Edit the doc so every row has a final `wire` / `remove` / `keep` recommendation (no `flag` remaining). Commit:

```bash
git add docs/audits/2026-06-26-dead-controls.md
git commit -m "docs(m10): resolve flagged dead-control decisions"
```

**Do not start Phase 2 until every row is resolved.**

---

## Phase 2 — Remediation (data-driven by the signed-off inventory)

Phase 2 has one task per surface (web, mobile, design-system). Each task instantiates the two patterns below for every row of its surface, grouped into small commits. The exact files/controls come from the inventory — the patterns are fixed.

### Remediation patterns

**WIRE pattern (control does something on the board):** TDD — write a failing component test asserting the handler fires the board-defined effect, wire the handler using the existing pattern for that effect (expo-router `router.push`, tRPC mutation hook, BottomSheet open, or `navigate`), run the test green.

**REMOVE pattern (control absent from the board):** delete the element JSX, then delete any handler, helper, import, and `strings.ts` entry it solely owned; grep to confirm no dangling references; update or delete any test that asserted the removed control.

### Task 6: Remediate web dead controls

**Files:**
- Modify: per the inventory's Web section (e.g. route components under `apps/web/src/features/**`, `apps/web/src/**/*.module.css`)
- Test: co-located `*.test.tsx` beside each wired component

**Interfaces:**
- Consumes: the finalized Web rows of `docs/audits/2026-06-26-dead-controls.md`.
- Produces: every Web row resolved; no remaining no-op handlers in `apps/web`.

Worked WIRE example (a row whose `Recommendation` is `wire` to a navigation target):

- [ ] **Step 1: Write the failing test**

```tsx
// apps/web/src/features/<feature>/components/<Component>.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { <Component> } from './<Component>';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', async (orig) => ({
  ...(await orig<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}));

describe('<Component>', () => {
  it('navigates to the board-defined target when the control is pressed', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button', { name: '<accessible name>' }));
    expect(navigate).toHaveBeenCalledWith({ to: '<board target route>' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @pantry/web test -- <Component>`
Expected: FAIL — handler is currently a no-op, `navigate` not called.

- [ ] **Step 3: Wire the handler**

Replace the dead handler with the real effect, e.g.:

```tsx
const navigate = useNavigate();
// ...
onClick={() => { navigate({ to: '<board target route>' }); }}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @pantry/web test -- <Component>`
Expected: PASS.

Worked REMOVE example (a row whose `Recommendation` is `remove`):

- [ ] **Step 5: Delete the control and its dead code**

Remove the element JSX, its handler, now-unused imports, and the `strings.ts` keys it solely owned. Then:

```bash
cd apps/web
grep -rn '<removed string key or symbol>' src   # expect: no matches
```

- [ ] **Step 6: Run lint + typecheck to confirm nothing dangles**

Run: `pnpm --filter @pantry/web lint && pnpm --filter @pantry/web typecheck`
Expected: PASS, no unused-import or unused-variable warnings.

- [ ] **Step 7: Repeat Steps 1–6 for every Web row, then commit per logical group**

```bash
git add apps/web docs/audits/2026-06-26-dead-controls.md
git commit -m "fix(web): wire/remove dead controls (<group>)"
```

Check off each Web inventory row as it lands (annotate the row with the commit or `done`).

### Task 7: Remediate mobile dead controls

**Files:**
- Modify: per the inventory's Mobile section (e.g. `apps/mobile/src/features/**`)
- Test: co-located `*.test.tsx` beside each wired component

**Interfaces:**
- Consumes: the finalized Mobile rows of the inventory.
- Produces: every Mobile row resolved; no remaining no-op handlers in `apps/mobile`.

Worked WIRE example (mobile navigation via expo-router):

- [ ] **Step 1: Write the failing test**

```tsx
// apps/mobile/src/features/<feature>/components/<Component>.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { <Component> } from './<Component>';

const push = vi.fn();
vi.mock('expo-router', () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

describe('<Component>', () => {
  it('navigates to the board-defined target on press', () => {
    render(<Component />);
    fireEvent.click(screen.getByTestId('<testID>'));
    expect(push).toHaveBeenCalledWith('<board target route>');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @pantry/mobile test -- <Component>`
Expected: FAIL — `push` not called (handler is a no-op stub).

- [ ] **Step 3: Wire the handler**

```tsx
const router = useRouter();
// ...
onPress={() => { router.push('<board target route>'); }}
```

For a control with no `Pressable` wrapper (e.g. a bare `Icon`), wrap it following the existing `add-ingredient-button` pattern in `PantryScreen.tsx:32-40` (`<Pressable testID=… onPress=… hitSlop={8}>`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @pantry/mobile test -- <Component>`
Expected: PASS.

- [ ] **Step 5: Apply the REMOVE pattern to mobile `remove` rows**

Same as Task 6 Steps 5–6 but `cd apps/mobile` and `pnpm --filter @pantry/mobile lint && pnpm --filter @pantry/mobile typecheck`.

- [ ] **Step 6: Repeat for every Mobile row, then commit per logical group**

```bash
git add apps/mobile docs/audits/2026-06-26-dead-controls.md
git commit -m "fix(mobile): wire/remove dead controls (<group>)"
```

### Task 8: Remediate design-system dead controls

**Files:**
- Modify: per the inventory's Design-system section (`packages/design-system/src/**`)
- Test: co-located `*.test.tsx`

**Interfaces:**
- Consumes: the finalized Design-system rows of the inventory.
- Produces: every Design-system row resolved; primitives no longer ship dead built-in controls.

- [ ] **Step 1: Apply the WIRE or REMOVE pattern per row**

For a primitive that swallows a control, the usual fix is to **forward** the handler prop rather than hardcode behavior. WIRE example test:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { <Primitive> } from './<Primitive>.js';

it('forwards press to the onPress prop', () => {
  const onPress = vi.fn();
  render(<Primitive onPress={onPress} />);
  fireEvent.click(screen.getByRole('button'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

Run: `pnpm --filter @pantry/design-system test` → fail, then implement the forward, then pass.

- [ ] **Step 2: Commit**

```bash
git add packages/design-system docs/audits/2026-06-26-dead-controls.md
git commit -m "fix(design-system): wire/remove dead controls"
```

### Task 9: Full-repo gate for workstream A

- [ ] **Step 1: Run all repo gates**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all green (postgres must be up: `podman compose -f infra/podman/compose.yaml up -d`).

- [ ] **Step 2: Confirm no dead controls remain**

```bash
grep -rnE 'on(Press|Click)=\{\(\) ?=> ?\{\}\}' apps packages --include='*.tsx' | grep -v node_modules   # expect: no matches
grep -rniE 'no-op (stub|for now)|wire(s)? (this|generation)|placeholder handler' apps packages --include='*.tsx' | grep -v node_modules   # expect: only intentional, board-justified cases noted in the inventory
```

- [ ] **Step 3: Commit any final inventory check-offs**

```bash
git add docs/audits/2026-06-26-dead-controls.md
git commit -m "docs(m10): mark dead-controls inventory remediated"
```

---

## Phase 3 — Mobile WeirdnessSlider stutter fix (independent of A)

Root cause: `packages/design-system/src/native/WeirdnessSlider/SliderTrack.tsx` animates the thumb's `left` via `thumbAnim.interpolate({ outputRange: ['0%','100%'] })`. Animating the layout property `left` as a percentage string cannot use the native driver and forces a JS-thread layout pass on every `setValue` — during a drag that is a relayout per frame, which stutters. Fix: drive the thumb with a compositor-only `transform: translateX` in pixels off the measured track width. Both `WeirdnessSlider` and `WeirdnessControl` consume `SliderTrack`, so both benefit.

### Task 10: Pure pixel-offset helper (TDD)

**Files:**
- Modify: `packages/design-system/src/native/WeirdnessSlider/weirdness.ts`
- Test: `packages/design-system/src/native/WeirdnessSlider/weirdness.test.ts`

**Interfaces:**
- Produces: `thumbTranslateX(value: number, trackWidth: number): number` — the pixel x-offset of the thumb centre for a 0–100 `value` on a `trackWidth`-px track. Consumed by `SliderTrack.tsx` (Task 11) as the interpolation output endpoints.

- [ ] **Step 1: Write the failing test**

Append to `weirdness.test.ts`:

```ts
import { thumbTranslateX } from './weirdness.js';

describe('thumbTranslateX', () => {
  it('maps a value to a pixel offset across the track', () => {
    expect(thumbTranslateX(0, 200)).toBe(0);
    expect(thumbTranslateX(50, 200)).toBe(100);
    expect(thumbTranslateX(100, 200)).toBe(200);
  });

  it('clamps out-of-range values and guards a zero width', () => {
    expect(thumbTranslateX(-10, 200)).toBe(0);
    expect(thumbTranslateX(150, 200)).toBe(200);
    expect(thumbTranslateX(50, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @pantry/design-system test -- weirdness`
Expected: FAIL — `thumbTranslateX` is not exported.

- [ ] **Step 3: Implement the helper**

Add to `weirdness.ts`:

```ts
/** Pixel x-offset of the thumb centre for a 0–100 value on a `trackWidth`-px track. */
export function thumbTranslateX(value: number, trackWidth: number): number {
  const clamped = Math.min(100, Math.max(0, value));
  return (clamped / 100) * trackWidth;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @pantry/design-system test -- weirdness`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/design-system/src/native/WeirdnessSlider/weirdness.ts packages/design-system/src/native/WeirdnessSlider/weirdness.test.ts
git commit -m "feat(design-system): add thumbTranslateX pixel-offset helper"
```

### Task 11: Refactor SliderTrack to transform-based thumb

**Files:**
- Modify: `packages/design-system/src/native/WeirdnessSlider/SliderTrack.tsx`
- Test: `packages/design-system/src/native/WeirdnessSlider/WeirdnessSlider.test.tsx` (existing — must stay green)

**Interfaces:**
- Consumes: `thumbTranslateX` (Task 10), existing `valueFromTouch`.

- [ ] **Step 1: Confirm existing slider tests pass before refactor (baseline)**

Run: `pnpm --filter @pantry/design-system test -- WeirdnessSlider`
Expected: PASS (5 tests).

- [ ] **Step 2: Move track width from a ref to state**

In `SliderTrack.tsx`, replace `const trackWidthRef = useRef(0);` with:

```tsx
const [trackWidth, setTrackWidth] = useState(0);
```

Update `onLayout` to `setTrackWidth(event.nativeEvent.layout.width);` and update `handleTouch` to read `trackWidth` instead of `trackWidthRef.current`. Add `useState` to the existing `react` import and drop `useRef` if `draggingRef` is the only other user (keep `useRef` for `draggingRef`).

- [ ] **Step 3: Interpolate to pixels and apply as a transform**

Replace the percentage interpolation:

```tsx
const thumbLeft = thumbAnim.interpolate({
  inputRange: [0, 100],
  outputRange: ['0%', '100%'],
});
```

with a pixel translate built from `thumbTranslateX`:

```tsx
const thumbTranslate = thumbAnim.interpolate({
  inputRange: [0, 100],
  outputRange: [thumbTranslateX(0, trackWidth), thumbTranslateX(100, trackWidth)],
});
```

Then in the `Animated.View` style array, replace `left: thumbLeft` with a fixed origin plus transform (keep `marginLeft: -thumbSize / 2` for centring):

```tsx
<Animated.View
  style={[
    styles.thumb,
    {
      width: thumbSize,
      height: thumbSize,
      left: 0,
      marginLeft: -thumbSize / 2,
      marginTop: -thumbSize / 2,
      transform: [{ translateX: thumbTranslate }],
      boxShadow: thumbShadow,
    },
  ]}
/>
```

Import the helper: add `thumbTranslateX` to the existing `import { parseGradientStops, valueFromTouch } from './weirdness.js';`.

- [ ] **Step 4: Run slider + control tests to verify they still pass**

Run: `pnpm --filter @pantry/design-system test -- WeirdnessSlider WeirdnessControl`
Expected: PASS — vocabulary, compact, and slider-role tests unchanged; thumb now positioned by transform.

- [ ] **Step 5: Lint + typecheck the package**

Run: `pnpm --filter @pantry/design-system lint && pnpm --filter @pantry/design-system typecheck`
Expected: PASS — no unused `percent`/`thumbLeft`, no `any`.

- [ ] **Step 6: Commit**

```bash
git add packages/design-system/src/native/WeirdnessSlider/SliderTrack.tsx
git commit -m "fix(mobile): drive WeirdnessSlider thumb via transform, not percentage left

Animating left as a percentage string forced a JS-thread layout per frame
during drags. translateX in pixels off the measured track width is
compositor-only, so the thumb glides without relayout."
```

### Task 12: Device/simulator verification of the slider

- [ ] **Step 1: Build the design-system package and launch the mobile app**

Run: `pnpm --filter @pantry/design-system build` then start the mobile app (Expo Go per the local-dev-runtime notes) and open a screen with the slider (Home prompt footer or generation prompt).

- [ ] **Step 2: Verify smooth drag**

Drag the thumb quickly end-to-end. Expected: the thumb tracks the finger smoothly with no stutter or lag, and the vocabulary word updates live. Record the result (pass/fail + note) — this is the real "no stutter" gate; unit tests cannot observe frame timing.

---

## Phase 4 — Roadmap bookkeeping

### Task 13: Add M10 to the roadmap Status table

**Files:**
- Modify: `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md` (Status table)

- [ ] **Step 1: Add the M10 row**

Append a row to the Status table after the M9 row:

```markdown
| M10 — Dead controls audit + slider fix | impl complete · review pending | `docs/superpowers/plans/2026-06-26-m10-dead-controls-slider.md` — audit-first sweep of dead/disconnected controls (web/mobile/design-system) per the board (`docs/audits/2026-06-26-dead-controls.md`); wired or removed each; fixed mobile WeirdnessSlider stutter (transform-based thumb, not percentage `left`). All automated gates green; slider verified on simulator |
```

(Set the State cell to match reality at completion time.)

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md
git commit -m "docs(roadmap): add M10 dead-controls audit + slider fix"
```

---

## Self-Review

**Spec coverage:**
- Workstream A audit definition + procedure → Phase 1 Tasks 1–5 (scaffold, web, mobile, design-system, review gate). ✓
- "Board is arbiter" recommendation rule → embedded in Global Constraints and Tasks 2–4 Step 3. ✓
- Audit-first + user review gate before fixes → Task 5 (explicit "do not start Phase 2"). ✓
- Inventory doc at `docs/audits/2026-06-26-dead-controls.md` with the specified columns + "Needs your decision" → Task 1. ✓
- "Everything interactive" scope → enumeration greps in Tasks 2–4 cover buttons, pressables, links, nav, role=button, affordance-only (cursor pointer / bare Icon). ✓
- Remediation: wire to board behavior / remove dead code + strings, unit/component tests only, no e2e → Tasks 6–8 patterns; no Playwright/Maestro steps anywhere. ✓
- Slider root cause + transform/translateX fix + tests → Tasks 10–12. ✓
- New milestone M10 row → Task 13. ✓

**Placeholder scan:** Phase 2 deliberately uses `<placeholder>` tokens because the exact controls are unknown until the inventory is signed off; each is paired with a fully worked, runnable example and an explicit "instantiate per inventory row" instruction. Phases 1, 3, 4 contain complete, literal content. No "TBD"/"add error handling"/"write tests for the above" placeholders.

**Type consistency:** `thumbTranslateX(value, trackWidth)` is defined in Task 10 and consumed with that exact signature in Task 11. `trackWidth` state replaces `trackWidthRef` consistently across Steps 2–3 of Task 11. `valueFromTouch` signature unchanged.
