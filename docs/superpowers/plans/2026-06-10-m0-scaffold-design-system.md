# M0 — Scaffold + Design System + Fidelity Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the v3 monorepo with CI-enforced engineering standards, a pixel-faithful `@pantry/design-system` (tokens + web primitives), and the `tools/design-fidelity` screenshot harness — no product features.

**Architecture:** pnpm workspace monorepo. Design tokens live once as CSS custom properties; a generator script derives the React Native token mirror. Web primitives are CSS-Modules components ported 1:1 from the design JSX. The fidelity harness serves the v2 design board hermetically (vendored React/Babel), captures per-frame reference screenshots, and produces side-by-side diff reports against app screenshots.

**Tech Stack:** pnpm, TypeScript (strict), ESLint flat config, Prettier, Vitest, @testing-library/react, Playwright, pixelmatch + pngjs, Podman compose (postgres only at M0).

**Scope note (deviation from roadmap, recorded in docs/decisions.md in Task 10):** RN primitive *components* (RN BottomSheet, MobileTabBar) move to M1 where the Expo app exists to render them. M0 ships the generated native token mirror so M1 can build on it. Containerfiles also land with their services (M1+); M0 compose runs postgres only.

**Design sources (read-only, in `/Users/mackmindenhall/Documents/pantry-copilot-v2/claudeDesignOutput/`):**
- `design-system/tokens.css` — canonical tokens (54 lines, port verbatim)
- `design-system/fonts/*.woff2` — Newsreader/Inter/JetBrains Mono variable fonts (copy)
- `components/primitives.jsx` — Icon, Eyebrow, Button, Pill, Field, Input, Card, Wordmark, WeirdnessSlider, WeirdnessControl (port to CSS Modules)
- `components/bottom-sheet.jsx`, `components/web-shell.jsx`, `components/nl-prompt.jsx` — BottomSheet, WebShell, NLPrompt (port)
- `All Screens.html` — the board the harness captures

---

### Task 1: Repo scaffold

**Files:**
- Create: `.gitignore`, `.npmrc`, `.prettierrc.json`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.env.example`

- [x] **Step 1: Write root config files**

`.npmrc`:
```ini
save-exact=true
engine-strict=true
```

`.gitignore`:
```
node_modules/
dist/
.tanstack/
.nitro/
.output/
.expo/
coverage/
*.tsbuildinfo
.env
.env.local
.DS_Store
playwright-report/
test-results/
tools/design-fidelity/output/
```

`.prettierrc.json`:
```json
{ "semi": true, "singleQuote": true, "trailingComma": "all", "printWidth": 100 }
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - apps/*
  - services/*
  - packages/*
  - tools/*
  - e2e/*
```

`package.json` (root):
```json
{
  "name": "pantry-copilot-v3",
  "private": true,
  "engines": { "node": ">=22.0.0", "pnpm": ">=10.0.0" },
  "packageManager": "pnpm@<pinned at install — see Step 2>",
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "typecheck": "pnpm -r --parallel typecheck",
    "test": "pnpm -r --parallel test",
    "build": "pnpm -r build",
    "format": "prettier --write ."
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

`.env.example`:
```ini
# Postgres (dev via infra/podman/compose.yaml)
DATABASE_URL=postgres://pantry:pantry@localhost:5432/pantry
# Filled in at later milestones:
# BETTER_AUTH_SECRET=
# AI_SERVICE_TOKEN=
# ANTHROPIC_API_KEY=
```

- [x] **Step 2: Pin toolchain versions**

Run: `node --version && pnpm --version`, then set `"packageManager": "pnpm@<exact installed version>"` in root package.json. Then:
`pnpm add -D -w typescript eslint prettier vitest @vitest/coverage-v8`
(`.npmrc save-exact` pins exact versions.)
Expected: lockfile created, exact versions in root package.json.

- [x] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: scaffold pnpm monorepo with strict TS base config"
```

---

### Task 2: `packages/config` — shared ESLint flat config + zod env loader

**Files:**
- Create: `packages/config/package.json`, `packages/config/tsconfig.json`, `packages/config/eslint.config.base.js`, `packages/config/src/env.ts`
- Test: `packages/config/src/env.test.ts`
- Create: `eslint.config.js` (root, consumes the base)

- [x] **Step 1: Package scaffold**

`packages/config/package.json`:
```json
{
  "name": "@pantry/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./eslint": "./eslint.config.base.js",
    "./env": "./dist/env.js",
    "./tsconfig.base.json": "../../tsconfig.base.json"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  }
}
```

`packages/config/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

- [x] **Step 2: Install eslint deps at workspace root**

```bash
pnpm add -D -w typescript-eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks @eslint-community/eslint-plugin-eslint-comments globals zod
```

- [x] **Step 3: Write the base ESLint flat config**

`packages/config/eslint.config.base.js` — encodes the non-negotiables:
```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.expo/**', '**/.output/**', '**/coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  comments.recommended,
  {
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      // v2 anti-recurrence: zero suppressions, zero any, bounded files
      '@eslint-community/eslint-comments/no-use': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    // app code only (set via files glob in consuming apps): no inline JSX string literals
    files: ['apps/**/src/**/*.tsx'],
    rules: { 'react/jsx-no-literals': 'error' },
  },
);
```

Root `eslint.config.js`:
```js
import base from './packages/config/eslint.config.base.js';
export default [
  ...base,
  {
    files: ['**/*.js', '**/*.config.*'],
    ...(await import('typescript-eslint')).default.configs.disableTypeChecked,
  },
];
```
(Adjust the disable-type-checked application per typescript-eslint's current docs for non-TS files; verify with `pnpm lint`.)

- [x] **Step 4: TDD the env loader — failing test first**

`packages/config/src/env.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('returns parsed values for a valid environment', () => {
    const schema = z.object({ DATABASE_URL: z.string().url() });
    const env = loadEnv(schema, { DATABASE_URL: 'postgres://u:p@localhost:5432/db' });
    expect(env.DATABASE_URL).toBe('postgres://u:p@localhost:5432/db');
  });

  it('throws listing every missing/invalid variable', () => {
    const schema = z.object({ DATABASE_URL: z.string().url(), PORT: z.coerce.number() });
    expect(() => loadEnv(schema, { PORT: 'not-a-number' })).toThrowError(
      /DATABASE_URL[\s\S]*PORT/,
    );
  });
});
```

Run: `pnpm --filter @pantry/config test` — Expected: FAIL (env.js not found).

- [x] **Step 5: Implement `loadEnv`**

`packages/config/src/env.ts`:
```ts
import type { z } from 'zod';

/** Parse env vars against a zod schema; fail fast with every problem listed. */
export function loadEnv<S extends z.ZodTypeAny>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
): z.infer<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return result.data as z.infer<S>;
}
```

- [x] **Step 6: Verify tests + lint pass**

Run: `pnpm --filter @pantry/config test && pnpm lint`
Expected: tests PASS, lint clean.

- [x] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(config): shared eslint flat config and zod env loader"
```

---

### Task 3: `packages/design-system` — tokens + native mirror generator

**Files:**
- Create: `packages/design-system/package.json`, `tsconfig.json`, `vitest.config.ts` (jsdom)
- Create: `packages/design-system/src/styles/tokens.css` (port verbatim from `claudeDesignOutput/design-system/tokens.css`, font paths adjusted to `../fonts/`)
- Copy: `claudeDesignOutput/design-system/fonts/{Newsreader-Variable,Newsreader-Italic,Inter-Variable,JetBrainsMono-Variable}.woff2` → `packages/design-system/fonts/` (Kitchen OS only — skip InstrumentSerif, that's the archived Cookbook brand)
- Create: `packages/design-system/scripts/generate-native-tokens.ts`
- Generated: `packages/design-system/src/tokens/native.ts` (checked in; regenerated by script)
- Test: `packages/design-system/scripts/generate-native-tokens.test.ts`

- [x] **Step 1: Package scaffold** (same pattern as Task 2; add `"generate:tokens": "tsx scripts/generate-native-tokens.ts"` script; deps: `react react-dom`, dev: `tsx @types/react @testing-library/react @testing-library/jest-dom jsdom`)

- [x] **Step 2: Port tokens.css verbatim + copy fonts**

Copy the 54-line file exactly (it is the design contract); only the `@font-face src` URLs change to `url('../../fonts/…')`. Drop the `body { background: #E5E5DD }` board-canvas background (that's the mockup board, not the app — app bg is `var(--bg)`); record this single deviation as a CSS comment.

- [x] **Step 3: TDD the native-token generator — failing test**

`scripts/generate-native-tokens.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseTokens } from './generate-native-tokens.js';

describe('parseTokens', () => {
  it('extracts flat color/radius vars from :root', () => {
    const css = `:root { --bg: #FAFAF7; --r-sm: 6px; --shadow-xs: 0 1px 0 rgba(14,18,14,0.04); }`;
    expect(parseTokens(css)).toEqual({
      bg: '#FAFAF7',
      rSm: 6,
      shadowXs: '0 1px 0 rgba(14,18,14,0.04)',
    });
  });
});
```

Run: `pnpm --filter @pantry/design-system test` — Expected: FAIL.

- [x] **Step 4: Implement generator**

`scripts/generate-native-tokens.ts`: `parseTokens(css)` regex-extracts `--name: value;` pairs inside `:root`, camelCases names, converts bare `NNpx` values to numbers, leaves everything else as strings. `main()` reads `src/styles/tokens.css`, emits `src/tokens/native.ts` as a typed `export const tokens = {...} as const;` with a `// GENERATED — run pnpm generate:tokens` header. Run the script, check in the output.

- [x] **Step 5: Verify** `pnpm --filter @pantry/design-system test && pnpm lint` — PASS.

- [x] **Step 6: Commit** `git commit -m "feat(design-system): Kitchen OS tokens + generated native mirror"`

---

### Task 4: Web primitives, batch 1 — Icon, Eyebrow, Button, Pill, Field, Input, Card, Wordmark

**Files:**
- Create per component: `packages/design-system/src/web/<Name>/<Name>.tsx` + `<Name>.module.css` + `<Name>.test.tsx`; barrel `packages/design-system/src/web/index.ts`
- Source: `claudeDesignOutput/components/primitives.jsx` (read each component; translate inline styles → CSS Modules referencing `var(--token)`s 1:1 — same px values, same colors via tokens, same variants)

Porting rules (apply to every component in Tasks 4–5):
1. Inline style values map to the token vars where a token exists (e.g. `#4F6B2E` → `var(--accent)`, `borderRadius: 10` → `var(--r-md)`); raw values that have no token stay as written in the design source.
2. Public APIs keep the design names: `Button kind: 'primary'|'secondary'|'ghost'|'inverse'|'danger'`, `size: 'sm'|'md'|'lg'`, `full`, `leftIcon`/`rightIcon`; `Pill tone: 'neutral'|'success'|'warning'|'danger'|'accent'|'inverse'|'outline'`; `Field label/hint/error`; `Wordmark` renders Pantry*Co*Pilot with italic accent em.
3. `Icon` uses `lucide-react` (real dependency) instead of the mockup's CDN mask trick — same `name`/`size`/`strokeWidth=1.6` API via a typed name map.
4. `Input` becomes a real controlled `<input>` (the mockup fakes it with a span) — visual styles identical.
5. Each component: one Testing Library test asserting render + variant class/behavior (e.g. Button fires onClick, disabled state; Field shows error over hint).
6. Files stay under 300 lines; no `any`; no inline string literals needed (primitives take children).

- [ ] **Step 1:** Write failing tests for the batch (one `.test.tsx` per component, assertions per rule 5). Run `pnpm --filter @pantry/design-system test` — FAIL.
- [ ] **Step 2:** Implement the eight components + CSS modules per porting rules. Tests PASS.
- [ ] **Step 3:** `pnpm lint && pnpm --filter @pantry/design-system typecheck` — clean.
- [ ] **Step 4:** Commit `feat(design-system): core web primitives ported from design board`.

---

### Task 5: Web primitives, batch 2 — WeirdnessSlider, WeirdnessControl, BottomSheet, NLPrompt, WebShell, Tabs

**Files:** same per-component layout as Task 4.
**Sources:** `primitives.jsx` (sliders), `components/bottom-sheet.jsx`, `components/nl-prompt.jsx`, `components/web-shell.jsx`.

Component notes:
- `WeirdnessSlider` / `WeirdnessControl`: real `<input type="range">` under the styled track (as the mockup does); label vocabulary `normal/curious/adventurous/chaotic evil` with the same breakpoints (25/55/85); gradient via `var(--weird-gradient)`. Test: label changes across breakpoint values.
- `BottomSheet` (web): the **one canonical sheet** — portal + scrim + panel, `open/onClose/title/children`, focus trap, Escape closes, scrim click closes. Read `bottom-sheet.jsx` for visual treatment (radius, grabber, padding). Test: open/close behavior + aria-modal.
- `NLPrompt`: prompt textarea + footer slot (where WeirdnessControl lives) + submit affordance, per `nl-prompt.jsx`.
- `WebShell`: top chrome/sidebar layout per `web-shell.jsx`; nav items as props (no routing dependency in the design-system package).
- `Tabs`: web tab row used by board screens (extract pattern from `web-shell.jsx`/screens; selected state must be unmistakable — v2 bug was "too subtle", board shows the correct treatment).

- [ ] **Step 1:** Failing tests per component.
- [ ] **Step 2:** Implement to green.
- [ ] **Step 3:** `pnpm lint && pnpm typecheck && pnpm test` clean.
- [ ] **Step 4:** Commit `feat(design-system): sheets, prompt, shell, and weirdness controls`.

---

### Task 6: Primitives gallery (the M0 screenshot subject)

**Files:**
- Create: `tools/design-fidelity/gallery/` — minimal Vite + React app: `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/Gallery.tsx`

`Gallery.tsx` renders every primitive in the states the board shows them (all Button kinds/sizes, all Pill tones, Field with hint and with error, Input empty/filled, Card, Wordmark, both weirdness controls at values 10/40/70/95, BottomSheet open, NLPrompt, WebShell frame, Tabs) on a `var(--bg)` page, grouped under Eyebrow headings, max-width 1280.

- [ ] **Step 1:** Scaffold gallery app; `pnpm --filter @pantry/design-fidelity-gallery dev` serves it; verify it renders by loading the page with Playwright (`page.goto` + screenshot) rather than eyeballing only.
- [ ] **Step 2:** `pnpm lint && pnpm typecheck` clean. *(gallery uses placeholder-free composition; jsx-no-literals does not apply outside `apps/`)*
- [ ] **Step 3:** Commit `feat(tools): primitives gallery for fidelity checks`.

---

### Task 7: `tools/design-fidelity` — board server, reference capture, compare report

**Files:**
- Create: `tools/design-fidelity/package.json` (deps: `playwright`, `pixelmatch`, `pngjs`, `serve-handler` or tiny http server; scripts below)
- Create: `tools/design-fidelity/vendor/` — download once and commit: `react.development.js`, `react-dom.development.js` (18.3.1 UMD), `babel.min.js` (@babel/standalone 7.x) — the exact files `All Screens.html` loads from CDN
- Create: `tools/design-fidelity/src/serve-board.ts` — static-serves `claudeDesignOutput/` with a URL rewrite of the three CDN script tags to `/vendor/*` (read the HTML, rewrite at serve time — never modify the v2 source)
- Create: `tools/design-fidelity/src/capture-references.ts`
- Create: `tools/design-fidelity/src/compare.ts`
- Create: `tools/design-fidelity/references/` (committed PNGs) and `output/` (gitignored reports)

- [ ] **Step 1: Vendor the CDN deps** (curl the three exact URLs from `All Screens.html` lines 35–37; verify SHA matches the integrity attributes). Commit them.
- [ ] **Step 2: Board server.** Serve v2 `claudeDesignOutput/` at `:4400` with script-tag rewrite + `/vendor` mount. Verify: `curl localhost:4400/All%20Screens.html` returns HTML with `/vendor/react.development.js`.
- [ ] **Step 3: Reference capture.** Playwright (chromium, deviceScaleFactor 2) opens the board, waits for `.frame` count to stabilize (Babel compiles async — wait for network idle + a settle delay + fonts.ready), then for each `.frame`: read its `.frame-label` text → slugify → screenshot the `.web-frame .web-body` element (web frames) or the IOSDevice root (mobile frames) → `references/<section>--<slug>.png`. Also dump `references/manifest.json` (label, section, kind, size). Run it; expect ~50 PNGs; spot-check 3 in an image viewer; commit.
- [ ] **Step 4: Compare + report.** `compare.ts <reference.png> <actual.png>`: pixelmatch diff → `output/<slug>/diff.png` + an `output/report.html` row of reference|actual|diff with the mismatch %. Test with the gallery: capture gallery Button section, compare against itself (0% mismatch) to prove the pipeline.
- [ ] **Step 5: M0 gate — primitives vs board.** Capture gallery sections and visually compare against the board's equivalent frames in the report (primitives appear inside screens, not as isolated frames, so this gate is human judgment over the side-by-side, not pixelmatch %). Fix any visible drift (spacing, weight, radius, color) before proceeding.
- [ ] **Step 6:** Commit `feat(tools): design-fidelity board server, reference capture, diff reports`.

---

### Task 8: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 1:** Write workflow; validate YAML locally (`node -e` yaml parse or `actionlint` if available).
- [ ] **Step 2:** Run the four commands locally in sequence — all green (this is the M0 "CI green" gate; actual GitHub run happens when a remote exists).
- [ ] **Step 3:** Commit `ci: lint/typecheck/test/build pipeline`.

---

### Task 9: Podman compose (postgres)

**Files:**
- Create: `infra/podman/compose.yaml`

```yaml
services:
  postgres:
    image: docker.io/library/postgres:17
    environment:
      POSTGRES_USER: pantry
      POSTGRES_PASSWORD: pantry
      POSTGRES_DB: pantry
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pantry"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  pgdata:
```

- [ ] **Step 1:** Write compose file.
- [ ] **Step 2:** Verify: `podman compose -f infra/podman/compose.yaml up -d && podman compose -f infra/podman/compose.yaml ps` shows healthy postgres; `down` cleans up. (If podman isn't installed locally, note it in the commit and verify with docker compose syntax-check only.)
- [ ] **Step 3:** Commit `infra: podman compose with postgres 17`.

---

### Task 10: Close out M0

- [ ] **Step 1:** Create `docs/decisions.md` with the two M0 scope notes (RN primitives → M1; Containerfiles land with services) and the tokens.css body-background deviation.
- [ ] **Step 2:** Run full gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green.
- [ ] **Step 3:** Update roadmap Status table: M0 → done, M1 → in progress; write M1 detailed plan (separate writing-plans session) and link it.
- [ ] **Step 4:** Commit `docs: M0 complete; roadmap status updated`.
