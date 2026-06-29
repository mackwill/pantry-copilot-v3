# Weirdness Divergence & Band Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each weirdness band deliver a measurably escalating amount of divergence in generated recipes, and unify the prompt's 5-band system with the UI's labels behind one source of truth in `@pantry/contracts`.

**Architecture:** Move the band display vocabulary and the score→label function into `packages/contracts/src/recipes/weirdness.ts` (next to the existing `weirdnessBand`). `design-system` takes a real `@pantry/contracts` dependency and its `shared/weirdness.ts` becomes a thin re-export, deleting the duplicated 4-label / 25-55-85 scheme. The generation system prompt's `BAND_GUIDANCE` is rewritten so each band names a specific, escalating count of "departure axes," plus a global single-ingredient anti-pattern line and a pre-emit self-audit.

**Tech Stack:** TypeScript (NodeNext/Bundler resolution), zod (contracts), Vitest, React / react-native-web (design-system tests), pnpm workspaces.

## Global Constraints

- No `eslint-disable` comments. No `any`. Lint runs `--max-warnings 0`.
- Components ≤300 lines (target 200); route files composition-only.
- User-facing strings live in per-feature `strings.ts` modules — never inline JSX literals. (The slider vocabulary words are domain constants in contracts, not JSX literals — they stay in `weirdness.ts`.)
- TDD; every slice ships with tests. Frequent commits.
- Pin exact dependency versions (`.npmrc` has `save-exact=true`). The one new dependency here is an internal `workspace:*` link, which carries no version pin.
- Repo gates that must pass before claiming completion: `pnpm lint`, `pnpm typecheck`, `pnpm test`. Postgres must be up for the `@pantry/api` suites (`podman compose -f infra/podman/compose.yaml up -d` or `pnpm db:up`).
- Contracts source uses **extensionless** relative imports (e.g. `from './enums'`); design-system source uses **`.js`** relative imports (e.g. `from '../../shared/weirdness.js'`). Bare package specifiers (`@pantry/contracts`) take no extension. Match the file you are editing.
- `verbatimModuleSyntax` is on everywhere: re-export types with the inline `type` modifier (`export { type WeirdnessLabel } from ...`).

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `packages/contracts/src/recipes/weirdness.ts` | Single source of truth: band math + display vocabulary | Modify (add labels + `weirdnessLabel`) |
| `packages/contracts/src/recipes/weirdness.test.ts` | Cutoff + label assertions | Modify (add label cases) |
| `packages/design-system/package.json` | Declare the contracts dependency | Modify |
| `packages/design-system/src/shared/weirdness.ts` | Thin re-export of contracts vocabulary | Replace body |
| `packages/design-system/src/native/WeirdnessSlider/weirdness.test.ts` | Native label-cutoff assertions | Modify (5-band cutoffs) |
| `packages/design-system/src/web/WeirdnessSlider/WeirdnessSlider.test.tsx` | Web slider label/vocab-row assertions | Modify (5-band cutoffs + 5th word) |
| `packages/design-system/src/native/WeirdnessControl/WeirdnessControl.test.tsx` | Native control word assertions | Modify (add `interesting`) |
| `packages/design-system/src/web/WeirdnessControl/WeirdnessControl.test.tsx` | Web control word assertions | Modify (add `interesting`) |
| `services/ai/src/prompts/recipes.ts` | Generation system prompt | Modify (`BAND_GUIDANCE`, axes, anti-pattern, self-audit) |
| `services/ai/src/prompts/recipes.test.ts` | Prompt-builder assertions | Modify (add divergence/audit cases) |
| `docs/decisions.md` | Log the 4→5 word slider change + the design-system→contracts dependency | Append entry |

**Note on already-correct surfaces (do not touch):**
- `packages/contracts/src/recipes/enums.ts` already exports the 5-band `WEIRDNESS_BANDS` and `WeirdnessBand` — no change.
- `packages/contracts/src/recipes/weirdness.ts`'s `weirdnessBand` (cutoffs 20/40/60/80) is already correct — leave it.
- `packages/design-system/src/native/WeirdnessSlider/weirdness.ts` already re-exports `WEIRDNESS_LABELS`, `weirdnessLabel`, `WeirdnessLabel` from `../../shared/weirdness.js` — its shape is unchanged; it inherits the 5 labels automatically.
- Both sliders/controls already render `WEIRDNESS_LABELS.map(...)` / `weirdnessLabel(value)` — they pick up the 5th word automatically. No component `.tsx` edits are needed, only their tests.
- `contracts/src/index.ts` already does `export * from './recipes/weirdness'` — new exports surface through `@pantry/contracts` with no index edit.

---

### Task 1: Contracts — band labels + `weirdnessLabel` (source of truth)

**Files:**
- Modify: `packages/contracts/src/recipes/weirdness.ts`
- Test: `packages/contracts/src/recipes/weirdness.test.ts`

**Interfaces:**
- Consumes: `WeirdnessBand` (type) and `weirdnessBand(score)` — both already in this file / `./enums`.
- Produces (relied on by Tasks 2):
  - `WEIRDNESS_BAND_LABELS: readonly ['normal', 'curious', 'interesting', 'adventurous', 'chaotic evil']`
  - `type WeirdnessLabel = (typeof WEIRDNESS_BAND_LABELS)[number]`
  - `WEIRDNESS_BAND_LABEL: Record<WeirdnessBand, WeirdnessLabel>` (identity except `chaotic` → `'chaotic evil'`)
  - `weirdnessLabel(score: number): WeirdnessLabel`

- [ ] **Step 1: Add the failing label tests**

Append to `packages/contracts/src/recipes/weirdness.test.ts`. Update the import on line 2 to pull the new symbols:

```ts
import {
  WEIRDNESS_BAND_LABEL,
  WEIRDNESS_BAND_LABELS,
  WEIRDNESS_BANDS,
  weirdnessBand,
  weirdnessLabel,
} from '../index';
```

Then append these describe blocks to the end of the file:

```ts
describe('WEIRDNESS_BAND_LABELS', () => {
  it('lists the five display words in ascending intensity', () => {
    expect(WEIRDNESS_BAND_LABELS).toEqual([
      'normal',
      'curious',
      'interesting',
      'adventurous',
      'chaotic evil',
    ]);
  });
});

describe('WEIRDNESS_BAND_LABEL', () => {
  it('is identity for every band except chaotic → "chaotic evil"', () => {
    expect(WEIRDNESS_BAND_LABEL.normal).toBe('normal');
    expect(WEIRDNESS_BAND_LABEL.curious).toBe('curious');
    expect(WEIRDNESS_BAND_LABEL.interesting).toBe('interesting');
    expect(WEIRDNESS_BAND_LABEL.adventurous).toBe('adventurous');
    expect(WEIRDNESS_BAND_LABEL.chaotic).toBe('chaotic evil');
  });
});

describe('weirdnessLabel', () => {
  it.each([
    [0, 'normal'],
    [20, 'normal'],
    [21, 'curious'],
    [40, 'curious'],
    [41, 'interesting'],
    [60, 'interesting'],
    [61, 'adventurous'],
    [80, 'adventurous'],
    [81, 'chaotic evil'],
    [100, 'chaotic evil'],
  ] as const)('maps score %i to label %s', (score, label) => {
    expect(weirdnessLabel(score)).toBe(label);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @pantry/contracts exec vitest run src/recipes/weirdness.test.ts`
Expected: FAIL — `WEIRDNESS_BAND_LABELS`, `WEIRDNESS_BAND_LABEL`, `weirdnessLabel` are not exported.

- [ ] **Step 3: Implement the labels in `weirdness.ts`**

Append below the existing `weirdnessBand` function in `packages/contracts/src/recipes/weirdness.ts`:

```ts
/** Ordered slider display words, one per band (ascending intensity). */
export const WEIRDNESS_BAND_LABELS = [
  'normal',
  'curious',
  'interesting',
  'adventurous',
  'chaotic evil',
] as const;

export type WeirdnessLabel = (typeof WEIRDNESS_BAND_LABELS)[number];

/** Band → slider display word. Identity except `chaotic` → "chaotic evil". */
export const WEIRDNESS_BAND_LABEL: Record<WeirdnessBand, WeirdnessLabel> = {
  normal: 'normal',
  curious: 'curious',
  interesting: 'interesting',
  adventurous: 'adventurous',
  chaotic: 'chaotic evil',
};

/** Score → slider display word, via the band mapping. */
export function weirdnessLabel(score: number): WeirdnessLabel {
  return WEIRDNESS_BAND_LABEL[weirdnessBand(score)];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @pantry/contracts exec vitest run src/recipes/weirdness.test.ts`
Expected: PASS — all describe blocks green, including the unchanged `weirdnessBand` cases.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/recipes/weirdness.ts packages/contracts/src/recipes/weirdness.test.ts
git commit -m "feat(contracts): weirdness band display labels + weirdnessLabel"
```

---

### Task 2: design-system consumes contracts; delete the duplicate band scheme

**Files:**
- Modify: `packages/design-system/package.json`
- Modify: `packages/design-system/src/shared/weirdness.ts`
- Test: `packages/design-system/src/native/WeirdnessSlider/weirdness.test.ts`
- Test: `packages/design-system/src/web/WeirdnessSlider/WeirdnessSlider.test.tsx`
- Test: `packages/design-system/src/native/WeirdnessControl/WeirdnessControl.test.tsx`
- Test: `packages/design-system/src/web/WeirdnessControl/WeirdnessControl.test.tsx`
- Modify: `docs/decisions.md`

**Interfaces:**
- Consumes from Task 1: `WEIRDNESS_BAND_LABELS`, `weirdnessLabel`, `WeirdnessLabel` from `@pantry/contracts`.
- Produces (unchanged public shape): `shared/weirdness.ts` still exports `WEIRDNESS_LABELS` (now 5 words), `weirdnessLabel`, `type WeirdnessLabel`. The native `WeirdnessSlider/weirdness.ts` re-export and both index barrels keep working untouched.

- [ ] **Step 1: Update the failing tests for the 5-band scheme**

The cutoff change (25/55/85 → 20/40/60/80, plus a new `interesting` band) breaks two tests and under-covers two others. Make all four edits now (they will fail until Steps 3–4 land).

**(a)** Replace the `weirdnessLabel` describe block in `packages/design-system/src/native/WeirdnessSlider/weirdness.test.ts` (lines 5–16) with:

```ts
describe('weirdnessLabel', () => {
  it('maps values to the five-band design vocabulary', () => {
    expect(weirdnessLabel(0)).toBe('normal');
    expect(weirdnessLabel(20)).toBe('normal');
    expect(weirdnessLabel(21)).toBe('curious');
    expect(weirdnessLabel(40)).toBe('curious');
    expect(weirdnessLabel(41)).toBe('interesting');
    expect(weirdnessLabel(60)).toBe('interesting');
    expect(weirdnessLabel(61)).toBe('adventurous');
    expect(weirdnessLabel(80)).toBe('adventurous');
    expect(weirdnessLabel(81)).toBe('chaotic evil');
    expect(weirdnessLabel(100)).toBe('chaotic evil');
  });
});
```

(Leave the `parseGradientStops`, `valueFromTouch`, and `thumbTranslateX` blocks in that file unchanged.)

**(b)** In `packages/design-system/src/web/WeirdnessSlider/WeirdnessSlider.test.tsx`, replace the `it('crosses label breakpoints at 25/55/85', ...)` test (lines 16–25) with a five-band version:

```ts
  it('crosses label breakpoints on the five-band scale', () => {
    const { rerender } = render(<WeirdnessSlider value={20} compact />);
    expect(screen.getByText('normal')).toBeTruthy();
    rerender(<WeirdnessSlider value={21} compact />);
    expect(screen.getByText('curious')).toBeTruthy();
    rerender(<WeirdnessSlider value={41} compact />);
    expect(screen.getByText('interesting')).toBeTruthy();
    rerender(<WeirdnessSlider value={61} compact />);
    expect(screen.getByText('adventurous')).toBeTruthy();
    rerender(<WeirdnessSlider value={81} compact />);
    expect(screen.getByText('chaotic evil')).toBeTruthy();
  });
```

And in the same file, add an `interesting` assertion to the vocabulary-row test (`it('shows the full vocabulary row only when not compact', ...)`), inserting after the existing `curious` line:

```ts
    expect(screen.getByText('interesting')).toBeTruthy();
```

**(c)** In `packages/design-system/src/native/WeirdnessControl/WeirdnessControl.test.tsx`, extend the breakpoint test (`it('changes the word across breakpoint values', ...)`) to cover the mid band. Add before its closing `});`:

```ts
    rerender(<WeirdnessControl value={50} />);
    expect(screen.getAllByText('interesting').length).toBeGreaterThan(0);
```

**(d)** In `packages/design-system/src/web/WeirdnessControl/WeirdnessControl.test.tsx`, add `[50, 'interesting']` to the `it.each` table (after the `[40, 'curious']` row):

```ts
    [50, 'interesting'],
```

- [ ] **Step 2: Run the design-system suite to verify the cutoff tests fail**

Run: `pnpm --filter @pantry/design-system test`
Expected: FAIL — native `weirdness.test.ts` and web `WeirdnessSlider.test.tsx` fail because the shared module still uses 4 labels / 25-55-85 cutoffs (e.g. `weirdnessLabel(41)` returns `'curious'`, not `'interesting'`).

- [ ] **Step 3: Add the contracts dependency**

In `packages/design-system/package.json`, add `@pantry/contracts` to `dependencies` (alphabetical, before `lucide-react`):

```json
  "dependencies": {
    "@pantry/contracts": "workspace:*",
    "lucide-react": "1.17.0",
    "lucide-react-native": "1.17.0"
  },
```

Then link it:

Run: `pnpm install`
Expected: lockfile updates; `@pantry/contracts` symlinked into design-system. No version-pin warning (workspace protocol).

- [ ] **Step 4: Replace `shared/weirdness.ts` with a re-export**

Replace the entire contents of `packages/design-system/src/shared/weirdness.ts` with:

```ts
// Single source of truth lives in @pantry/contracts. The hardcoded 4-label
// list and 25/55/85 cutoffs that used to live here were a duplicate of the
// band system that actually drives the generation prompt — deleted.
export {
  WEIRDNESS_BAND_LABELS as WEIRDNESS_LABELS,
  weirdnessLabel,
  type WeirdnessLabel,
} from '@pantry/contracts';
```

- [ ] **Step 5: Run the full design-system suite to verify it passes**

Run: `pnpm --filter @pantry/design-system test`
Expected: PASS — every weirdness test (native + web sliders and controls) is green with 5 labels.

- [ ] **Step 6: Typecheck design-system (catches resolution/`verbatimModuleSyntax` issues)**

Run: `pnpm --filter @pantry/design-system typecheck`
Expected: PASS — `@pantry/contracts` resolves, the `type` re-export is accepted.

- [ ] **Step 7: Log the decision**

Append to `docs/decisions.md`:

```markdown
## 2026-06-29 — Weirdness slider: 5-band vocabulary + contracts as source of truth

The slider now renders **five** tick words (`normal · curious · interesting ·
adventurous · chaotic evil`) instead of four. The board is silent on the
weirdness slider (already a composed-from-primitives decision), so the band
count is ours; we matched it to the 5-band system that drives the generation
prompt so the visible label always equals the band feeding the model. The old
`design-system` copy (4 labels, cutoffs 25/55/85) was a duplicate of the
contracts band scheme and the source of the label/output mismatch — deleted.
`design-system` now takes a real `@pantry/contracts` dependency and
`shared/weirdness.ts` re-exports the vocabulary from there. The native
current-word slot still sizes to the widest already-present words
("adventurous" / "chaotic evil"); "interesting" is narrower, so no new max.
```

- [ ] **Step 8: Commit**

```bash
git add packages/design-system/package.json packages/design-system/src/shared/weirdness.ts \
  packages/design-system/src/native/WeirdnessSlider/weirdness.test.ts \
  packages/design-system/src/web/WeirdnessSlider/WeirdnessSlider.test.tsx \
  packages/design-system/src/native/WeirdnessControl/WeirdnessControl.test.tsx \
  packages/design-system/src/web/WeirdnessControl/WeirdnessControl.test.tsx \
  docs/decisions.md pnpm-lock.yaml
git commit -m "feat(design-system): unify weirdness vocabulary behind @pantry/contracts (5 bands)"
```

---

### Task 3: Escalating-divergence generation prompt

**Files:**
- Modify: `services/ai/src/prompts/recipes.ts`
- Test: `services/ai/src/prompts/recipes.test.ts`

**Interfaces:**
- Consumes: `weirdnessBand`, `WeirdnessBand` from `@pantry/contracts` (already imported in the file); `BAND_BOUNDS` / `intensityCalibration` (already in the file — unchanged).
- Produces: no new exported symbols. `buildGenerationSystemPrompt(weirdness, pantry, options)` keeps its signature; only the prompt text changes.

- [ ] **Step 1: Add the failing prompt-content tests**

Append to `services/ai/src/prompts/recipes.test.ts` (inside the existing `describe('buildGenerationSystemPrompt', ...)` block, before its closing `});`):

```ts
  it('escalates the required divergence count band by band', () => {
    expect(buildGenerationSystemPrompt(10, [])).toMatch(/zero departures/i);
    expect(buildGenerationSystemPrompt(30, [])).toMatch(/exactly one/i);
    expect(buildGenerationSystemPrompt(50, [])).toMatch(/one full departure/i);
    expect(buildGenerationSystemPrompt(70, [])).toMatch(/two or more departures/i);
    const chaotic = buildGenerationSystemPrompt(95, []);
    expect(chaotic).toMatch(/three or more/i);
    expect(chaotic).toMatch(/core expectation/i);
  });

  it('forbids a lone single-ingredient change above curious', () => {
    expect(buildGenerationSystemPrompt(70, [])).toMatch(
      /single ingredient is NOT a departure/i,
    );
  });

  it('requires a pre-emit divergence self-audit kept out of whySuggested', () => {
    const prompt = buildGenerationSystemPrompt(70, []);
    expect(prompt).toMatch(/self-audit/i);
    expect(prompt).toMatch(/whySuggested/);
  });
```

- [ ] **Step 2: Run the prompt tests to verify the new ones fail**

Run: `pnpm --filter @pantry/ai exec vitest run src/prompts/recipes.test.ts`
Expected: FAIL — the three new tests fail (e.g. no "zero departures" / "self-audit" text yet); the eight existing tests still pass.

- [ ] **Step 3: Rewrite `BAND_GUIDANCE` + add axes, anti-pattern, and self-audit**

In `services/ai/src/prompts/recipes.ts`:

**(a)** Add a shared departure-axes constant directly above `const BAND_GUIDANCE` (replacing the need to repeat the axis list):

```ts
/** The axes a recipe can diverge along — named once, referenced by the band
 *  requirements below and the brainstorm step. */
const DEPARTURE_AXES =
  'cuisine, technique, flavor profile, hero ingredient, format, course, temperature, time of day';
```

**(b)** Replace the entire `BAND_GUIDANCE` object (current lines 12–23) with:

```ts
const BAND_GUIDANCE: Record<WeirdnessBand, string> = {
  normal:
    'Required divergence: ZERO departures. Stay canonical and conservative on purpose — familiar, broadly-recognized combinations and canonical technique. Failure mode: a recipe a competent home cook would consider strange or attention-seeking.',
  curious:
    'Required divergence: EXACTLY ONE small move. A single ingredient swap or addition is acceptable ONLY in this band. The dish must still read as the thing it is. Failure mode: a perfectly textbook execution with no personality, or swapping out the dish\'s central identity.',
  interesting:
    `Required divergence: ONE FULL departure on a meaningful axis (${DEPARTURE_AXES}) — more than an ingredient swap — while keeping the result coherent and inviting. Failure mode: a recipe a cook would call "just the normal version."`,
  adventurous:
    `Required divergence: TWO OR MORE departures on DISTINCT axes (${DEPARTURE_AXES}). Failure mode: the canonical/textbook version, or that version with a single item traded.`,
  chaotic:
    `Required divergence: THREE OR MORE departures on DISTINCT axes (${DEPARTURE_AXES}), at least one of which subverts a CORE expectation of the dish — its format, temperature, course, or cuisine identity. Always food-safe and genuinely edible. Failure mode: anything a reader would call "normal."`,
};
```

**(c)** Update the brainstorm-discipline line (current line 82) to reference the shared axes. Replace:

```ts
    'Brainstorming discipline (the single biggest lever on quality): before committing, generate at least SIX distinct candidate ideas spanning at least FOUR axes (cuisine, format, technique, hero ingredient, course, temperature). Narrow ideation is the most common cause of bland output — do not skip the wide pass.',
```

with:

```ts
    `Brainstorming discipline (the single biggest lever on quality): before committing, generate at least SIX distinct candidate ideas spanning at least FOUR departure axes (${DEPARTURE_AXES}). Narrow ideation is the most common cause of bland output — do not skip the wide pass.`,
```

**(d)** Add the global anti-pattern line and the pre-emit self-audit line. Insert them into the `lines` array immediately after the `intensityCalibration(weirdness, band)` entry (current line 86), so they read:

```ts
    `Weirdness band: ${band} (score ${String(weirdness)}/100). ${BAND_GUIDANCE[band]}`,
    intensityCalibration(weirdness, band),
    'Departure floor: adding, removing, or substituting a single ingredient is NOT a departure for any band above `curious` — count such a change as zero.',
    'Pre-emit self-audit: before calling `emit_recipe`, in your thinking list the departure axes you used and the resulting count, confirm the count meets the current band\'s required-divergence floor, and revise the recipe if it falls short. Keep this audit in your reasoning — never narrate it in `whySuggested`.',
```

- [ ] **Step 4: Run the prompt tests to verify they pass**

Run: `pnpm --filter @pantry/ai exec vitest run src/prompts/recipes.test.ts`
Expected: PASS — all eleven tests green (the original "selects band posture" / "intensity calibration" tests still match: `normal`, `chaotic`, `floor`, `ceiling` text remains present).

- [ ] **Step 5: Commit**

```bash
git add services/ai/src/prompts/recipes.ts services/ai/src/prompts/recipes.test.ts
git commit -m "feat(ai): escalating per-band divergence floors + pre-emit self-audit"
```

---

### Task 4: Repo-wide verification

**Files:** none (verification only). No code changes; this task exists because the spec requires all three gates green across the whole workspace and the band/label change touches multiple packages.

- [ ] **Step 1: Ensure postgres is up (required for `@pantry/api` suites)**

Run: `podman compose -f infra/podman/compose.yaml up -d`
Expected: postgres container running (or already up).

- [ ] **Step 2: Lint the whole repo**

Run: `pnpm lint`
Expected: PASS, zero warnings (`--max-warnings 0`).

- [ ] **Step 3: Typecheck the whole repo**

Run: `pnpm typecheck`
Expected: PASS for every workspace, including `@pantry/design-system` resolving `@pantry/contracts`.

- [ ] **Step 4: Run the full test suite**

Run: `pnpm test`
Expected: PASS across all packages — contracts, design-system, ai, api, apps. No weirdness label/cutoff regressions.

- [ ] **Step 5: Confirm the working tree is clean**

Run: `git status --short`
Expected: empty (all changes committed in Tasks 1–3). If anything is dirty, investigate before claiming completion.

---

## Self-Review

**Spec coverage:**
- "Make each band measurably escalating" → Task 3 (`BAND_GUIDANCE` rewrite, anti-pattern, self-audit). ✓
- "Unify into a single 5-band source of truth" → Task 1 (contracts labels) + Task 2 (design-system re-export, duplicate deleted). ✓
- Contracts API: `weirdnessBand` unchanged ✓ (left as-is); `WEIRDNESS_BAND_LABELS` ✓; `WEIRDNESS_BAND_LABEL` ✓; `weirdnessLabel` ✓ — all Task 1.
- "UI consumes contracts; delete 4-label list + 25/55/85 cutoffs" → Task 2 Steps 3–4. ✓
- "Both sliders render the 5th word automatically" → confirmed in File Structure note; no component edits, tests assert it (Task 2 Step 1b/c/d). ✓
- Departure-axis vocabulary consolidated and named once → Task 3 Step 3a (`DEPARTURE_AXES`), reused in band guidance + brainstorm line. ✓
- Global anti-pattern line + pre-emit self-audit + `intensityCalibration` retained → Task 3 Step 3d (audit/anti-pattern) and unchanged `intensityCalibration`. ✓
- Testing: contracts cutoffs/labels (Task 1), ai prompt directives (Task 3), design-system 5 words (Task 2), all three repo gates (Task 4). ✓
- `whySuggested` leakage guard kept → the existing "Do not narrate your tool plans in `whySuggested`" line is untouched, and the new self-audit line repeats the constraint. ✓
- Decisions log for the 4→5 word board deviation + contracts dependency (the spec's one reviewable judgment call) → Task 2 Step 7. ✓

**Fallback note (spec "Risks"):** The plan takes the *primary* recommendation — a real `@pantry/contracts` dependency in design-system. The test-only-devDependency-parity fallback is not used; if a reviewer vetoes the runtime dependency, that is a re-plan, not an in-flight switch.

**Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to Task N" — every code and test block is literal. ✓

**Type consistency:** `WEIRDNESS_BAND_LABELS` / `WeirdnessLabel` / `weirdnessLabel` / `WEIRDNESS_BAND_LABEL` names are identical across Task 1 (definition), Task 2 (`@pantry/contracts` import + `WEIRDNESS_BAND_LABELS as WEIRDNESS_LABELS` re-export), and the unchanged native re-export. `DEPARTURE_AXES` defined and referenced only within `recipes.ts` (Task 3). ✓
