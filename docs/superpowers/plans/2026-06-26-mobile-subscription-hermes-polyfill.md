# Mobile Recipe-Generation Streaming Fix (Hermes Disposable Symbols) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **RESOLVED 2026-06-26.** All three tasks done and verified on an iPhone 15 sim
> (`maestro test e2e/mobile/generation.yaml` passes end-to-end). **Root-cause correction
> found during Task 3:** the disposable-symbol polyfill (Tasks 1–2) was *necessary but not
> sufficient* — it fixed the "Object is not disposable" disposal throw, which had been
> masking the real trigger. Once disposal worked, the legible error was
> `ReferenceError: Property 'crypto' doesn't exist`: `newRequestId()` (in `@pantry/api-client`
> `request-id.ts`, sent on every request via `requestIdHeaders()`) called the bare global
> `crypto.randomUUID()`, which Hermes lacks. The added fix is a non-crypto UUIDv4 fallback
> in `request-id.ts` (zero deps; web/Node keep using `crypto.randomUUID()`). See
> `docs/decisions.md` (2026-06-26) and `docs/checklists/m9-fidelity-sweep.md`.

**Goal:** Make mobile recipe generation stream to a result instead of failing with "The generation hit a snag", by polyfilling the explicit-resource-management globals that Hermes lacks but tRPC v11's subscription transport requires.

**Architecture:** Add a tiny, dependency-free polyfill module that installs `Symbol.dispose`, `Symbol.asyncDispose`, and `SuppressedError` when the JS engine omits them, and import it as the very first thing the app loads (before any tRPC code). No changes to the tRPC client, the RN EventSource adapter, or the API are needed — those are already correct and the API SSE endpoint is verified working via curl.

**Tech Stack:** Expo (~56) / React Native / Hermes, `expo-router`, `@trpc/client` 11.17.0 (`httpSubscriptionLink` + `splitLink`), `react-native-sse` 1.2.1, Vitest (react-native-web/jsdom), Maestro.

## Root cause (confirmed — read before implementing)

The recipe-generation subscription is the **only** subscription in the app. tRPC routes it through `httpSubscriptionLink`, whose bundled `_usingCtx` helper (from `@oxc-project/runtime`, inlined in `@trpc/client/dist/index.mjs`) implements `using`/`await using` resource disposal. The two halves of that machinery disagree on Hermes:

- **Producer** — `@trpc/server`'s `makeResource` (`resolveResponse-*.mjs:521`) writes the disposer to `it[Symbol.dispose]`. On Hermes `Symbol.dispose` is `undefined`, so it actually writes to the string property key `"undefined"`.
- **Consumer** — the oxc `_usingCtx` helper (`@trpc/client/dist/index.mjs:560`) reads `e$1[Symbol.dispose || Symbol.for("Symbol.dispose")]`. Because `Symbol.dispose` is falsy, it falls back to the **real** `Symbol.for("Symbol.dispose")` symbol — not the string `"undefined"`.

Producer key (`"undefined"`) ≠ consumer key (`Symbol.for("Symbol.dispose")`), so the lookup returns `undefined`, line 561 throws `TypeError("Object is not disposable.")`, and the oxc `err()` path (line 599) re-wraps it in an empty `SuppressedError` — the exact symptom recorded in `docs/checklists/m9-fidelity-sweep.md`. The throw happens inside the subscription's setup/teardown, so the request never streams and `useGeneration`'s `onError` flips the screen to "hit a snag".

Defining the two symbols as real symbols (and a `SuppressedError` class for legibility) before any tRPC code runs makes producer and consumer agree on the same key. The same applies to the async path (`makeAsyncResource` / `Symbol.asyncDispose`, consumer line 559).

## Global Constraints

- No `eslint-disable` comments. No `any`. `--max-warnings 0`. Components ≤300 lines (target 200); route files composition-only.
- TDD; every slice ships with tests; web/mobile slices without tests do not merge.
- Pin exact dependency versions (`.npmrc` has `save-exact=true`); upgrade only at milestone boundaries. **This fix adds zero dependencies.**
- User-facing strings live in per-feature `strings.ts` modules — never inline JSX literals. (No user-facing strings are added by this plan.)
- Repo-wide gates before any completion claim: `pnpm lint`, `pnpm typecheck`, `pnpm test` (postgres must be up: `podman compose -f infra/podman/compose.yaml up -d`).

## File Structure

- `apps/mobile/src/lib/polyfills.ts` (new) — `installDisposableSymbols(symbolHost?, globalHost?)` plus a module-level side-effect call against the real globals. Injectable hosts so the polyfill is unit-testable in Node (the real `Symbol.dispose` is non-configurable and cannot be deleted to simulate Hermes).
- `apps/mobile/src/lib/polyfills.test.ts` (new) — unit tests for `installDisposableSymbols`.
- `apps/mobile/index.js` (new) — custom entry that imports the polyfill first, then `expo-router/entry`.
- `apps/mobile/package.json` (modify `main`) — point at the new entry.

---

### Task 1: The disposable-symbols polyfill

**Files:**
- Create: `apps/mobile/src/lib/polyfills.ts`
- Test: `apps/mobile/src/lib/polyfills.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export function installDisposableSymbols(symbolHost?: DisposableSymbolHost, globalHost?: SuppressedErrorHost): void` — installs `dispose`/`asyncDispose` on `symbolHost` (default: the global `Symbol`) and `SuppressedError` on `globalHost` (default: `globalThis`) only when each is absent. The module also calls `installDisposableSymbols()` once at import time against the real globals.
  - `interface DisposableSymbolHost { dispose?: symbol; asyncDispose?: symbol }`
  - `interface SuppressedErrorHost { SuppressedError?: unknown }`

- [x] **Step 1: Write the failing test**

Create `apps/mobile/src/lib/polyfills.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { installDisposableSymbols } from './polyfills';

interface SymbolHost {
  dispose?: symbol;
  asyncDispose?: symbol;
}
interface GlobalHost {
  SuppressedError?: unknown;
}

describe('installDisposableSymbols', () => {
  it('installs dispose/asyncDispose/SuppressedError on hosts that lack them (Hermes)', () => {
    const symbolHost: SymbolHost = {};
    const globalHost: GlobalHost = {};

    installDisposableSymbols(symbolHost, globalHost);

    expect(typeof symbolHost.dispose).toBe('symbol');
    expect(typeof symbolHost.asyncDispose).toBe('symbol');
    expect(typeof globalHost.SuppressedError).toBe('function');
  });

  it('uses the same well-known symbols the tRPC client falls back to', () => {
    // @trpc/server's makeResource writes obj[Symbol.dispose]; @trpc/client's
    // using-helper reads obj[Symbol.dispose || Symbol.for('Symbol.dispose')].
    // After the polyfill the producer key must equal the consumer fallback key.
    const symbolHost: SymbolHost = {};

    installDisposableSymbols(symbolHost, {});

    expect(symbolHost.dispose).toBe(Symbol.for('Symbol.dispose'));
    expect(symbolHost.asyncDispose).toBe(Symbol.for('Symbol.asyncDispose'));
  });

  it('makes a makeResource-style write resolvable by the using-helper lookup', () => {
    const symbolHost: SymbolHost = {};
    installDisposableSymbols(symbolHost, {});

    // Producer side (mirrors @trpc/server makeResource).
    const producerKey = symbolHost.dispose as symbol;
    const resource: Record<symbol, () => void> = {};
    resource[producerKey] = () => {};

    // Consumer side (mirrors the oxc usingCtx lookup).
    const consumerKey = symbolHost.dispose ?? Symbol.for('Symbol.dispose');
    expect(typeof resource[consumerKey]).toBe('function');
  });

  it('does not overwrite symbols the engine already provides', () => {
    const existing = Symbol('existing-dispose');
    const symbolHost: SymbolHost = { dispose: existing };

    installDisposableSymbols(symbolHost, {});

    expect(symbolHost.dispose).toBe(existing);
  });

  it('SuppressedError carries the error and suppressed values', () => {
    const globalHost: GlobalHost = {};
    installDisposableSymbols({}, globalHost);

    const Ctor = globalHost.SuppressedError as new (
      error: unknown,
      suppressed: unknown,
      message?: string,
    ) => Error & { error: unknown; suppressed: unknown };
    const err = new Ctor('inner', 'outer', 'both failed');

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SuppressedError');
    expect(err.error).toBe('inner');
    expect(err.suppressed).toBe('outer');
    expect(err.message).toBe('both failed');
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @pantry/mobile test -- polyfills`
Expected: FAIL — `Failed to resolve import "./polyfills"` / `installDisposableSymbols is not a function`.

- [x] **Step 3: Write the minimal implementation**

Create `apps/mobile/src/lib/polyfills.ts`:

```ts
/**
 * Hermes (the JS engine behind Expo Go and dev builds) ships without the
 * explicit-resource-management globals that tRPC v11's `httpSubscriptionLink`
 * depends on: `Symbol.dispose`, `Symbol.asyncDispose`, and `SuppressedError`.
 *
 * Without them recipe generation fails with "The generation hit a snag":
 * `@trpc/server`'s `makeResource` writes its disposer to `obj[Symbol.dispose]`
 * — which is `obj["undefined"]` on Hermes — while `@trpc/client`'s bundled
 * `using` helper reads `obj[Symbol.dispose || Symbol.for('Symbol.dispose')]`,
 * i.e. the real well-known symbol. The keys disagree, the lookup throws, and
 * the error surfaces as an empty `SuppressedError` before the request leaves
 * the device.
 *
 * Installing these as real symbols makes producer and consumer agree. We use
 * `Symbol.for(...)` so the installed value is identical to the helper's own
 * fallback key. Must run before any tRPC code; `apps/mobile/index.js` imports
 * this module first.
 */

interface DisposableSymbolHost {
  dispose?: symbol;
  asyncDispose?: symbol;
}

interface SuppressedErrorHost {
  SuppressedError?: unknown;
}

/** Mirrors the ES2026 `SuppressedError` shape the oxc `using` helper expects. */
class SuppressedErrorPolyfill extends Error {
  readonly error: unknown;
  readonly suppressed: unknown;

  constructor(error: unknown, suppressed: unknown, message?: string) {
    super(message);
    this.name = 'SuppressedError';
    this.error = error;
    this.suppressed = suppressed;
  }
}

/**
 * Install the disposable-resource globals on the given hosts if missing.
 * Hosts are injectable because the real `Symbol.dispose` is non-configurable
 * and cannot be deleted to simulate Hermes in a Node test environment.
 */
export function installDisposableSymbols(
  symbolHost: DisposableSymbolHost = Symbol as unknown as DisposableSymbolHost,
  globalHost: SuppressedErrorHost = globalThis as SuppressedErrorHost,
): void {
  symbolHost.dispose ??= Symbol.for('Symbol.dispose');
  symbolHost.asyncDispose ??= Symbol.for('Symbol.asyncDispose');
  globalHost.SuppressedError ??= SuppressedErrorPolyfill;
}

installDisposableSymbols();
```

- [x] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @pantry/mobile test -- polyfills`
Expected: PASS (5 tests).

- [x] **Step 5: Lint + typecheck the new file**

Run: `pnpm --filter @pantry/mobile lint && pnpm --filter @pantry/mobile typecheck`
Expected: no errors, no warnings (no `any`, no `eslint-disable`).

- [x] **Step 6: Commit**

```bash
git add apps/mobile/src/lib/polyfills.ts apps/mobile/src/lib/polyfills.test.ts
git commit -m "fix(mobile): polyfill disposable symbols for tRPC subscriptions on Hermes

Hermes lacks Symbol.dispose/Symbol.asyncDispose/SuppressedError, which tRPC v11's
httpSubscriptionLink uses for resource management. The mismatch threw an empty
SuppressedError and broke recipe generation ('hit a snag'). Install real symbols
before any tRPC code runs.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Load the polyfill before tRPC via a custom entry

**Files:**
- Create: `apps/mobile/index.js`
- Modify: `apps/mobile/package.json` (the `"main"` field)

**Interfaces:**
- Consumes: `apps/mobile/src/lib/polyfills.ts` (Task 1) — its import-time side effect.
- Produces: app entry that guarantees the polyfill runs before `expo-router/entry` (and therefore before `src/lib/api.ts` constructs the tRPC client or any subscription runs).

Why a dedicated entry and not an import at the top of `_layout.tsx`: module evaluation order across the route tree is not something to rely on, and the failure mode (a hard-to-diagnose runtime throw on a real device) is expensive. A single first-line import is unambiguous and is the documented Expo pattern.

- [x] **Step 1: Create the entry file**

Create `apps/mobile/index.js`:

```js
// Custom entry: install the Hermes disposable-symbol polyfills BEFORE expo-router
// pulls in any tRPC code. tRPC v11's httpSubscriptionLink (recipe generation)
// throws an empty SuppressedError on Hermes without them. See src/lib/polyfills.ts.
import './src/lib/polyfills';
import 'expo-router/entry';
```

- [x] **Step 2: Point package.json at the new entry**

In `apps/mobile/package.json`, change:

```json
  "main": "expo-router/entry",
```

to:

```json
  "main": "index.js",
```

- [x] **Step 3: Typecheck and lint the workspace**

Run: `pnpm --filter @pantry/mobile typecheck && pnpm --filter @pantry/mobile lint`
Expected: no errors, no warnings. (`index.js` is plain JS with two side-effect imports; if the mobile ESLint config flags `.js`, confirm it is covered or excluded the same way other root config files are — do not add an `eslint-disable`.)

- [x] **Step 4: Verify Metro still resolves the entry**

Run: `pnpm --filter @pantry/mobile exec expo start --dev-client` (or `expo start`), wait for "Waiting on http://localhost:8081", then `curl -s 'http://localhost:8081/index.bundle?platform=ios&dev=true' | head -c 200` from another shell.
Expected: a JS bundle is returned (not a Metro resolution error mentioning `index.js` or `polyfills`). Stop Metro afterward.

- [x] **Step 5: Commit**

```bash
git add apps/mobile/index.js apps/mobile/package.json
git commit -m "fix(mobile): load disposable-symbol polyfill before tRPC via custom entry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: End-to-end verification on a device (the real bug repro)

This is the proof the fix works: the existing `e2e/mobile/generation.yaml` flow drives Home → §04 Thinking/Drafting → §02 Result and asserts `recipe-card-mobile` appears — the exact frame that fails today with "hit a snag". The unit tests prove the symbols install; only a Hermes run proves the subscription streams.

**Files:** none (verification only). Uses `e2e/mobile/sign-in.yaml` and `e2e/mobile/generation.yaml`.

**Interfaces:**
- Consumes: the running mobile app (Task 1 + Task 2), a live `api` (:4000) and `ai` (:4001, mock provider), and the seeded maestro user.

- [x] **Step 1: Start the backends and create the test user**

Run (per the flow preconditions and `local-dev-runtime` memory — shared podman postgres on 5432; the api uses the **native** postgres on 5432, IPv4):

```bash
podman compose -f infra/podman/compose.yaml up -d
pnpm --filter @pantry/api dev   # serves :4000
DEFAULT_AI_PROVIDER=mock pnpm --filter @pantry/ai dev   # serves :4001, no keys
# Create the maestro user (idempotent — ignore "user exists"):
curl -X POST localhost:4000/api/auth/sign-up/email -H 'content-type: application/json' \
  -d '{"name":"Maestro","email":"maestro@example.com","password":"hunter2hunter2"}'
```

Expected: api responds on :4000, ai on :4001, sign-up returns a session or "user already exists".

- [x] **Step 2: Build/launch the app on a booted simulator with the fix**

Run (Maestro needs `JAVA_HOME`, per the `local-dev-runtime` memory):

```bash
export JAVA_HOME=$(/usr/libexec/java_home)
pnpm --filter @pantry/mobile exec expo run:ios   # installs com.pantrycopilot.app with the new entry
```

Expected: app launches on the simulator showing "Welcome back" (signed out) or "YOUR KITCHEN" (already signed in). **Crucially: no immediate crash.** A red-box / Hermes throw at launch means the entry wiring is wrong — return to Task 2.

- [x] **Step 3: Sign in**

Run: `maestro test e2e/mobile/sign-in.yaml`
Expected: PASS — ends on `assertVisible: 'Home'`.

- [x] **Step 4: Run the generation flow — the actual fix verification**

Run: `maestro test e2e/mobile/generation.yaml`
Expected: PASS. Specifically the stream must progress past Thinking and reach `assertVisible: { id: 'recipe-card-mobile' }` and `'Start cooking'`. **Before this fix, the screen showed "The generation hit a snag" and this flow failed.** If it still fails with "hit a snag", STOP — the polyfill did not load before tRPC; do not stack another fix, return to systematic debugging (re-check that `index.js` is the active entry and that `installDisposableSymbols()` runs at import).

- [x] **Step 5: Run the full repo gates**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass (postgres up from Step 1).

- [x] **Step 6: Record the fix and unblock the fidelity frame**

Update `docs/checklists/m9-fidelity-sweep.md`: change the `result-after-generation--mobile-result` line from "BLOCKED BY BUG…" to note the bug is fixed (Hermes disposable-symbol polyfill) and the frame is now capturable. Add a line to `docs/decisions.md` recording the chosen fix (polyfill `Symbol.dispose`/`Symbol.asyncDispose`/`SuppressedError` at a custom entry, zero new deps) and why (Hermes lacks ES2026 explicit-resource-management used by tRPC v11 `httpSubscriptionLink`).

- [x] **Step 7: Commit**

```bash
git add docs/checklists/m9-fidelity-sweep.md docs/decisions.md
git commit -m "docs(mobile): record Hermes subscription fix; unblock mobile result frame

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:** Root cause (Hermes missing disposable symbols) → Task 1 installs them; load-order requirement (before tRPC) → Task 2 custom entry; "test it yourself via API + Maestro" → Task 3 runs the existing sign-in + generation flows against a live api/ai. Zero new deps respected. No user-facing strings added. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output. ✓

**Type consistency:** `installDisposableSymbols(symbolHost?, globalHost?)` and the `DisposableSymbolHost`/`SuppressedErrorHost` shapes are identical between Task 1's implementation and its tests; Task 2 consumes only the import side effect. ✓

**Open risk (call out during execution):** If the generation flow still fails after the fix, the likely causes in priority order are (a) `index.js` not actually the active entry (Metro cache — `expo start -c`), (b) Hermes also missing async-generator/`Symbol.asyncIterator` support (Expo 56's Hermes supports these, so unlikely). Do not add speculative polyfills unless Step 4 evidence demands it — that would re-enter systematic-debugging Phase 1.
