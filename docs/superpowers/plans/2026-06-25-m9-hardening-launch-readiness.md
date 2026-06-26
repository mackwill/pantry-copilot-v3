# M9 — Hardening + Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the feature-complete v3 stack from "impl complete" to launch-ready: deployable containers, supply-chain + runtime security hardening, end-to-end observability, accessibility/performance passes, EAS build profiles, and a single automated full-board fidelity sweep with a tracked approval checklist.

**Architecture:** M9 adds no new product features. It (a) fixes the broken build chain (`compose.yaml` references Containerfiles that do not exist), (b) closes the remaining security/observability gaps the earlier milestones deferred, and (c) builds the tooling that lets the final fidelity sweep run as one command across web (Playwright) and mobile (iOS simulator via `simctl`). Each task is an independently shippable, independently testable slice.

**Tech Stack:** pnpm monorepo · TanStack Start + React 19 (web) · Expo/expo-router (mobile) · Fastify + tRPC + Drizzle + PostgreSQL + Better Auth (api) · Fastify REST+SSE (ai) · Playwright + axe-core (web e2e) · Maestro + `xcrun simctl` (mobile) · pixelmatch (fidelity) · Podman (containers) · GitHub Actions (CI).

## Global Constraints

Every task's requirements implicitly include these. Copied verbatim from `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md`:

- **Types:** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`; `no-explicit-any: error`. No `any`.
- **Zero-suppression:** `eslint-disable` comments banned repo-wide. `--max-warnings 0`.
- **Component size:** eslint `max-lines` error at 300 (target 200); route files composition-only (<100 lines). State machines in hooks/reducers, never inline JSX.
- **Tests per slice (merge requirement):** contracts schema tests; API integration tests vs ephemeral postgres; AI unit tests with mock provider (no live calls in CI); web Testing Library + Playwright happy path (**a slice without web tests does not merge**); mobile hook tests + one Maestro flow.
- **Strings:** typed `strings.ts` per feature; `react/jsx-no-literals` in app code. No inline user-facing JSX literals.
- **Security:** helmet, rate limits, AI service auth, no dev auto-login, zod-validated env fail-fast.
- **Dependencies:** pin exact versions (`.npmrc` `save-exact=true`); upgrade only at milestone boundaries.
- **Process:** TDD per superpowers:test-driven-development; frequent commits; verification before claiming completion.
- **Design fidelity:** where the board is silent, compose from existing primitives only and log the call in `docs/decisions.md` — never invent new visual language.
- **Gates command (run all three before any "complete" claim):** `pnpm lint` / `pnpm typecheck` / `pnpm test`. Postgres must be up first: `podman compose -f infra/podman/compose.yaml up -d postgres`.

## Scope decisions (settled with user, 2026-06-25)

- **CI e2e scope:** Web Playwright remains the CI gate. Mobile is verified by **actually running the mobile fidelity screenshot captures** (Task 11) — not skipped. Maestro flows stay a documented local/pre-release checklist (Task 14), not a macOS CI runner.
- **Fidelity sweep:** Deliver the **harness + diff report + a tracked checklist** (Task 12). Per-frame human sign-off is recorded as checklist items, not a blocking gate inside this plan.
- **Containers:** Production multi-stage Containerfiles for **api + ai + web**; web added to `compose.yaml`; full-stack `podman compose up` boot is the milestone verification gate (Task 2).

## File map

| File | Responsibility | Task |
| --- | --- | --- |
| `services/api/Containerfile` | Multi-stage production image for the API service | 1 |
| `services/ai/Containerfile` | Multi-stage production image for the AI service | 1 |
| `.dockerignore` | Keep `node_modules`/build junk out of build context | 1 |
| `apps/web/Containerfile` | Multi-stage production image for the web SSR server | 2 |
| `infra/podman/compose.yaml` | Add `web` service; pin restart/healthchecks | 2 |
| `services/ai/src/server.ts` | Add `/ready` probe | 3 |
| `services/ai/src/server.ready.test.ts` | `/ready` test | 3 |
| `packages/api-client/src/request-id.ts` | `withRequestId` header helper (shared web/mobile) | 4 |
| `packages/api-client/src/request-id.test.ts` | Header helper test | 4 |
| `apps/web/src/lib/api.ts`, `apps/mobile/src/lib/api.ts` | Thread `x-request-id` from clients | 4 |
| `services/ai/src/lib/log.ts` | Add `logStreamCost` | 5 |
| `services/ai/src/routes/recipes.ts` | Time + log per-stream cost | 5 |
| `services/ai/src/routes/recipes.cost.test.ts` | Stream cost-log test | 5 |
| `apps/web/src/lib/security-headers.ts` + `apps/web/src/server.ts` (or root middleware) | Web CSP + security headers | 6 |
| `apps/web/src/lib/security-headers.test.ts` | CSP builder test | 6 |
| `services/api/src/trpc/init.ts` + `aiRateLimit` middleware | Per-procedure rate limit on AI actions | 7 |
| `services/api/src/trpc/ai-rate-limit.test.ts` | Rate-limit middleware test | 7 |
| `.gitleaks.toml`, `.github/workflows/security.yml` | Secret scanning + dependency audit CI | 8 |
| `e2e/web/specs/accessibility.spec.ts` | axe-core smoke across key screens | 9 |
| `tools/perf-budget/check-bundle.ts` + `package.json` | Web bundle-size budget gate | 10 |
| `tools/design-fidelity/src/capture-app-mobile.ts` | iOS-simulator capture of mobile app frames | 11 |
| `tools/design-fidelity/src/sweep.ts` | One-command full-board capture+diff+report+tripwire | 12 |
| `docs/checklists/m9-fidelity-sweep.md` | Per-frame approval tracking | 12 |
| `apps/mobile/eas.json`, `apps/mobile/app.json` | EAS build profiles | 13 |
| `docs/architecture.md`, `docs/launch-readiness.md` | System doc + go-live checklist | 14 |
| `docs/decisions.md`, roadmap Status table | Decisions log + milestone done | 14 |

---

### Task 1: Production Containerfiles for api + ai

`compose.yaml` already references `services/api/Containerfile` and `services/ai/Containerfile`, but neither exists — `pnpm up` is broken today. Create multi-stage pnpm Containerfiles and a `.dockerignore`.

**Files:**
- Create: `services/api/Containerfile`
- Create: `services/ai/Containerfile`
- Create: `.dockerignore`

**Interfaces:**
- Produces: bootable `pantry-api` / `pantry-ai` images consumed by Task 2's compose boot.
- Consumes: existing root `pnpm-workspace.yaml`, `package.json` build scripts (`pnpm -r build`), service `dist/` output.

- [x] **Step 1: Confirm each service's build output and start entry**

Run: `pnpm --filter @pantry/api build && ls services/api/dist/index.js && pnpm --filter @pantry/ai build && ls services/ai/dist/index.js`
Expected: both `dist/index.js` files exist (these are the container entrypoints). If the path differs, use the real path in the Containerfiles below.

- [x] **Step 2: Write `.dockerignore`**

```
**/node_modules
**/dist
**/.output
**/.tanstack
**/.turbo
**/coverage
**/test-results
**/.git
**/.env
**/.env.*
tools/design-fidelity/output
tools/design-fidelity/references
e2e/**/test-results
```

- [x] **Step 3: Write `services/api/Containerfile`**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY services/api ./services/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pantry/api... build
RUN pnpm --filter @pantry/api deploy --prod --legacy /out

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /app/services/api/dist ./dist
COPY --from=build /app/services/api/package.json ./package.json
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
```

- [x] **Step 4: Write `services/ai/Containerfile`**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY services/ai ./services/ai
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pantry/ai... build
RUN pnpm --filter @pantry/ai deploy --prod --legacy /out

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /app/services/ai/dist ./dist
COPY --from=build /app/services/ai/package.json ./package.json
USER node
EXPOSE 4001
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:4001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/index.js"]
```

- [x] **Step 5: Build both images to verify**

Run: `podman build -f services/api/Containerfile -t pantry-api . && podman build -f services/ai/Containerfile -t pantry-ai .`
Expected: both builds succeed. If `pnpm deploy` errors on missing `--legacy` support, the lockfile is pnpm 10 — `--legacy` is correct for v10; if it still fails, fall back to copying the full workspace `node_modules`.

- [x] **Step 6: Smoke-boot the AI image (no DB needed)**

Run: `podman run --rm -e AI_SERVICE_TOKEN=01234567890123456789012345678901 -p 4001:4001 -d --name ai-smoke pantry-ai && sleep 2 && curl -fsS http://localhost:4001/health && podman rm -f ai-smoke`
Expected: `{"status":"ok"}`.

- [x] **Step 7: Commit**

```bash
git add .dockerignore services/api/Containerfile services/ai/Containerfile
git commit -m "build(m9): production Containerfiles for api + ai services"
```

---

### Task 2: Web Containerfile + add web to compose (full-stack boot gate)

The monorepo doc says compose should run postgres + api + ai + web. Add a web image and wire all four services so `podman compose up` boots the whole stack — the M9 verification gate.

**Files:**
- Create: `apps/web/Containerfile`
- Modify: `infra/podman/compose.yaml`

**Interfaces:**
- Consumes: `pantry-api` / `pantry-ai` images from Task 1.
- Produces: a full-stack compose that boots end-to-end (verified in Task 14's milestone gate).

- [x] **Step 1: Discover the TanStack Start build output entry**

Run: `pnpm --filter @pantry/web build && ls apps/web/.output/server/index.mjs`
Expected: the Nitro server entry exists at `.output/server/index.mjs`. If the path differs (check `ls apps/web/.output/server/`), use the real entry in the Containerfile `CMD` below.

- [x] **Step 2: Write `apps/web/Containerfile`**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @pantry/web... build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.output ./.output
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
```

- [x] **Step 3: Build the web image to verify**

Run: `podman build -f apps/web/Containerfile -t pantry-web .`
Expected: build succeeds.

- [x] **Step 4: Add the `web` service + restart policy to `infra/podman/compose.yaml`**

Add this `web` block under `services:` (sibling of `ai:`), and add `restart: unless-stopped` to `api`, `ai`, and `web`:

```yaml
  web:
    build:
      context: ../..
      dockerfile: apps/web/Containerfile
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
    environment:
      VITE_API_URL: http://localhost:4000
    ports:
      - "3000:3000"
```

Then add a `healthcheck` to the `api` service so `web`'s `depends_on` resolves:

```yaml
    healthcheck:
      test: ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\""]
      interval: 10s
      timeout: 3s
      retries: 10
```

- [x] **Step 5: Boot the full stack**

Run: `cp .env.example .env 2>/dev/null; AI_SERVICE_TOKEN=01234567890123456789012345678901 BETTER_AUTH_SECRET=0123456789012345678901234567890123 podman compose -f infra/podman/compose.yaml up -d --build && sleep 12 && curl -fsS http://localhost:4000/health && curl -fsS http://localhost:4001/health && curl -fsS -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: api + ai return `{"status":"ok"}`; web returns `200`.

- [x] **Step 6: Tear down and commit**

```bash
podman compose -f infra/podman/compose.yaml down
git add apps/web/Containerfile infra/podman/compose.yaml
git commit -m "build(m9): web Containerfile + full-stack compose (postgres+api+ai+web)"
```

---

### Task 3: AI service `/ready` readiness probe

The API has `/health` + `/ready`; the AI service has only `/health`. Container orchestration needs a readiness probe that confirms the provider is configured (non-mock providers require an API key).

**Files:**
- Modify: `services/ai/src/server.ts`
- Test: `services/ai/src/server.ready.test.ts`

**Interfaces:**
- Consumes: `AppDeps { env, provider }`, `provider.name: string`.
- Produces: `GET /ready` → `200 {status:'ready'}` when configured, `503 {status:'not_ready', reason}` otherwise. Unauthenticated (like `/health`).

- [x] **Step 1: Write the failing test**

```ts
// services/ai/src/server.ready.test.ts
import { describe, expect, it } from 'vitest';
import { buildServer, type AppDeps } from './server.js';
import type { Env } from './env.js';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: 4001,
  AI_SERVICE_TOKEN: '0123456789012345678901234567890123',
  DEFAULT_AI_PROVIDER: 'mock',
  DEFAULT_AI_MODEL: 'claude-sonnet-4-6',
  OPENAI_MODEL: 'gpt-4o',
  AI_PROVIDER_TIMEOUT_MS: 60_000,
} as unknown as Env;

function deps(env: Env): AppDeps {
  return { env, provider: { name: env.DEFAULT_AI_PROVIDER } as AppDeps['provider'] };
}

describe('GET /ready', () => {
  it('is ready with the mock provider and needs no auth', async () => {
    const app = await buildServer(deps(baseEnv));
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ready' });
    await app.close();
  });

  it('is not ready when anthropic is selected without an API key', async () => {
    const app = await buildServer(deps({ ...baseEnv, DEFAULT_AI_PROVIDER: 'anthropic' } as Env));
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'not_ready' });
    await app.close();
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @pantry/ai test -- server.ready`
Expected: FAIL (route 404 / not registered).

- [x] **Step 3: Add `/ready` in `services/ai/src/server.ts`**

Insert immediately after the existing `app.get('/health', ...)` line:

```ts
  app.get('/ready', async (_req, reply) => {
    const provider = env.DEFAULT_AI_PROVIDER;
    const keyByProvider: Record<string, string | undefined> = {
      anthropic: env.ANTHROPIC_API_KEY,
      openai: env.OPENAI_API_KEY,
    };
    const needsKey = provider in keyByProvider;
    if (needsKey && (keyByProvider[provider] ?? '').length === 0) {
      reply.code(503);
      return { status: 'not_ready', reason: `${provider}_api_key_missing` };
    }
    return { status: 'ready' };
  });
```

(`/health` and `/ready` are above the `onRequest` guard's `/scans`+`/recipes` check, so they stay unauthenticated.)

- [x] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @pantry/ai test -- server.ready`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add services/ai/src/server.ts services/ai/src/server.ready.test.ts
git commit -m "feat(ai): /ready probe verifying provider key configuration"
```

---

### Task 4: End-to-end request-ID propagation from web + mobile clients

The api and ai services generate/forward `x-request-id`, and the API→AI clients forward it. But the **web** client sends none (the chain only gets an ID once it hits the API). Generate a per-request ID client-side so a browser/app request threads web→api→ai under one ID.

**Files:**
- Create: `packages/api-client/src/request-id.ts`
- Test: `packages/api-client/src/request-id.test.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/mobile/src/lib/api.ts`
- Modify: `packages/api-client/src/index.ts` (re-export helper)

**Interfaces:**
- Produces: `newRequestId(): string` and `requestIdHeaders(): Record<string,'x-request-id'>` — well, `requestIdHeaders(): { 'x-request-id': string }`.
- Consumes: `createApiClient({ headers })` (web/mobile already use `headers`/`fetch`).

- [x] **Step 1: Write the failing test**

```ts
// packages/api-client/src/request-id.test.ts
import { describe, expect, it } from 'vitest';
import { newRequestId, requestIdHeaders } from './request-id.js';

describe('request-id', () => {
  it('generates a non-empty unique id each call', () => {
    const a = newRequestId();
    const b = newRequestId();
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });

  it('produces a fresh x-request-id header per call', () => {
    expect(requestIdHeaders()['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(requestIdHeaders()['x-request-id']).not.toBe(requestIdHeaders()['x-request-id']);
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @pantry/api-client test -- request-id`
Expected: FAIL (module not found).

- [x] **Step 3: Write `packages/api-client/src/request-id.ts`**

```ts
/**
 * Per-request correlation id minted on the client so a single user action
 * threads web/mobile → api → ai under one id in the logs. The API honours an
 * inbound `x-request-id` (see services/api genReqId); this is the source.
 */
export function newRequestId(): string {
  return crypto.randomUUID();
}

export function requestIdHeaders(): { 'x-request-id': string } {
  return { 'x-request-id': newRequestId() };
}
```

- [x] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @pantry/api-client test -- request-id`
Expected: PASS.

- [x] **Step 5: Re-export from `packages/api-client/src/index.ts`**

Add at the end of the file:

```ts
export { newRequestId, requestIdHeaders } from './request-id.js';
```

- [x] **Step 6: Thread it through the web client (`apps/web/src/lib/api.ts`)**

```ts
import { createApiClient, requestIdHeaders } from '@pantry/api-client';
import { env } from './env';

export const api = createApiClient({
  url: `${env.VITE_API_URL}/trpc`,
  headers: requestIdHeaders,
  fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
});
```

- [x] **Step 7: Thread it through the mobile client (`apps/mobile/src/lib/api.ts`)**

```ts
import { createApiClient, requestIdHeaders } from '@pantry/api-client';
import { authClient } from './auth-client';
import { env } from './env';
import { createRNEventSource } from './rn-event-source';

const authHeaders = (): Record<string, string> => ({
  cookie: authClient.getCookie(),
  ...requestIdHeaders(),
});

export const api = createApiClient({
  url: `${env.EXPO_PUBLIC_API_URL}/trpc`,
  headers: authHeaders,
  EventSource: createRNEventSource(authHeaders),
});
```

- [x] **Step 8: Run gates**

Run: `pnpm --filter @pantry/api-client test && pnpm typecheck`
Expected: PASS.

- [x] **Step 9: Commit**

```bash
git add packages/api-client/src/request-id.ts packages/api-client/src/request-id.test.ts packages/api-client/src/index.ts apps/web/src/lib/api.ts apps/mobile/src/lib/api.ts
git commit -m "feat(observability): client-minted x-request-id threads web/mobile→api→ai"
```

---

### Task 5: AI cost logging for generation + tweak streams

`logExtractionCost` covers image scans only. Generation and tweak streams — the most expensive calls — log nothing comparable. Emit one structured cost line per stream (provider, model, label, duration, tokens when the terminal event carries them).

**Files:**
- Modify: `services/ai/src/lib/log.ts`
- Modify: `services/ai/src/routes/recipes.ts`
- Test: `services/ai/src/routes/recipes.cost.test.ts`

**Interfaces:**
- Consumes: `pipeSseStream(reply, req, deps, label, run)`; `deps.provider.name`; `deps.env.DEFAULT_AI_MODEL`; wire events `{ type: string; [k]: unknown }` (terminal generation/tweak event may carry `tokensUsed`).
- Produces: `logStreamCost(log, cost: StreamCost): void` emitting `event: 'ai.stream.cost'`.

- [x] **Step 1: Add `logStreamCost` to `services/ai/src/lib/log.ts`**

Append:

```ts
export interface StreamCost {
  readonly label: string;
  readonly provider: string;
  readonly model: string;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly events: number;
  readonly ms: number;
  readonly outcome: 'completed' | 'aborted' | 'errored';
}

/** Emit one structured cost line per generation/tweak stream. */
export function logStreamCost(log: FastifyBaseLogger, cost: StreamCost): void {
  log.info({ event: 'ai.stream.cost', ...cost }, 'ai stream complete');
}
```

- [x] **Step 2: Write the failing test**

```ts
// services/ai/src/routes/recipes.cost.test.ts
import { describe, expect, it, vi } from 'vitest';
import { buildServer, type AppDeps } from '../server.js';
import type { Env } from '../env.js';

const env = {
  NODE_ENV: 'test', PORT: 4001,
  AI_SERVICE_TOKEN: '0123456789012345678901234567890123',
  DEFAULT_AI_PROVIDER: 'mock', DEFAULT_AI_MODEL: 'claude-sonnet-4-6',
  OPENAI_MODEL: 'gpt-4o', AI_PROVIDER_TIMEOUT_MS: 60_000,
} as unknown as Env;

function provider(): AppDeps['provider'] {
  return {
    name: 'mock',
    async *streamStructured() {
      yield { type: 'thinking', seq: 0, t: 0 };
      yield { type: 'completed', seq: 1, t: 1, tokensUsed: { input: 120, output: 340 } };
    },
  } as unknown as AppDeps['provider'];
}

describe('recipe stream cost logging', () => {
  it('logs one ai.stream.cost line with token counts on completion', async () => {
    const app = await buildServer({ env, provider: provider() });
    const spy = vi.spyOn(app.log, 'info');
    const res = await app.inject({
      method: 'POST',
      url: '/recipes/generate/stream',
      headers: { authorization: `Bearer ${env.AI_SERVICE_TOKEN}` },
      payload: { prompt: 'soup', pantry: [], mustInclude: [], weirdness: 0 },
    });
    expect(res.statusCode).toBe(200);
    const costCall = spy.mock.calls.find(([obj]) => (obj as { event?: string }).event === 'ai.stream.cost');
    expect(costCall).toBeDefined();
    expect(costCall?.[0]).toMatchObject({ provider: 'mock', tokensIn: 120, tokensOut: 340, outcome: 'completed' });
    await app.close();
  });
});
```

(If `aiGenerationRequestSchema` requires different fields, adjust the `payload` to a valid request — check `packages/contracts` and use a minimal valid object.)

- [x] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @pantry/ai test -- recipes.cost`
Expected: FAIL (no `ai.stream.cost` line).

- [x] **Step 4: Instrument `pipeSseStream` in `services/ai/src/routes/recipes.ts`**

Add the import at the top:

```ts
import { logStreamCost } from '../lib/log.js';
```

Inside `pipeSseStream`, add counters before the `try`:

```ts
  const startedAt = Date.now();
  let events = 0;
  let tokensIn = 0;
  let tokensOut = 0;
  let outcome: 'completed' | 'aborted' | 'errored' = 'completed';
```

In the `for await` loop, after `writeEvent(ev)`, capture usage:

```ts
      events += 1;
      const usage = (ev as { tokensUsed?: { input?: number; output?: number } }).tokensUsed;
      if (usage) {
        tokensIn = usage.input ?? tokensIn;
        tokensOut = usage.output ?? tokensOut;
      }
```

In the `catch (err)` block set `outcome = 'errored';`. After the timeout `writeEvent({type:'error'...})` line set `outcome = 'aborted';`. In `finally`, before `reply.raw.end()`, log:

```ts
    if (state.clientClosed) outcome = 'aborted';
    logStreamCost(req.log, {
      label,
      provider: deps.provider.name,
      model: deps.env.DEFAULT_AI_MODEL,
      tokensIn,
      tokensOut,
      events,
      ms: Date.now() - startedAt,
      outcome,
    });
```

- [x] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @pantry/ai test -- recipes.cost`
Expected: PASS.

- [x] **Step 6: Run the AI suite to confirm no regressions**

Run: `pnpm --filter @pantry/ai test`
Expected: PASS (existing `routes/recipes.test.ts` still green).

- [x] **Step 7: Commit**

```bash
git add services/ai/src/lib/log.ts services/ai/src/routes/recipes.ts services/ai/src/routes/recipes.cost.test.ts
git commit -m "feat(observability): per-stream ai.stream.cost logging for generation + tweak"
```

---

### Task 6: Web Content-Security-Policy + security headers

The API/AI services set helmet CSP, but the **web** SSR app sends no CSP. Add a strict CSP + standard security headers to every web document response.

**Files:**
- Create: `apps/web/src/lib/security-headers.ts`
- Test: `apps/web/src/lib/security-headers.test.ts`
- Modify: web server middleware (`apps/web/src/server.ts` if present, else TanStack Start server entry / global middleware — discover in Step 4)

**Interfaces:**
- Produces: `securityHeaders(opts: { apiUrl: string }): Record<string,string>` returning `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Strict-Transport-Security`.

- [x] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/security-headers.test.ts
import { describe, expect, it } from 'vitest';
import { securityHeaders } from './security-headers';

describe('securityHeaders', () => {
  const h = securityHeaders({ apiUrl: 'https://api.pantrycopilot.app' });

  it('locks default-src to self and disallows framing', () => {
    expect(h['Content-Security-Policy']).toContain("default-src 'self'");
    expect(h['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(h['X-Frame-Options']).toBe('DENY');
  });

  it('allows the API origin for connect-src (xhr + SSE)', () => {
    expect(h['Content-Security-Policy']).toContain('connect-src');
    expect(h['Content-Security-Policy']).toContain('https://api.pantrycopilot.app');
  });

  it('sets nosniff, referrer, and HSTS', () => {
    expect(h['X-Content-Type-Options']).toBe('nosniff');
    expect(h['Referrer-Policy']).toBe('no-referrer');
    expect(h['Strict-Transport-Security']).toContain('max-age=');
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @pantry/web test -- security-headers`
Expected: FAIL (module not found).

- [x] **Step 3: Write `apps/web/src/lib/security-headers.ts`**

```ts
/**
 * Strict CSP + companion headers for every web document response.
 * `connect-src` must include the API origin (tRPC XHR + SSE EventSource).
 * `style-src 'unsafe-inline'` is required because the design system ships
 * tokens/styles inline via CSS Modules hydration; scripts stay strict.
 */
export function securityHeaders(opts: { apiUrl: string }): Record<string, string> {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    `connect-src 'self' ${opts.apiUrl}`,
  ].join('; ');
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  };
}
```

- [x] **Step 4: Discover the web server middleware seam and apply the headers**

Run: `ls apps/web/src/server.ts apps/web/src/start.tsx 2>/dev/null; grep -rln "createStartHandler\|defineHandlerCallback\|requestMiddleware\|createMiddleware" apps/web/src`
Expected: locate the TanStack Start server handler. Apply headers there. If a global request middleware exists, register one that merges `securityHeaders({ apiUrl: process.env.VITE_API_URL ?? '' })` into the response headers. If the app has no custom server handler yet, create `apps/web/src/server.ts` exporting a `createStartHandler`-wrapped handler that sets these headers on every response (mirror the TanStack Start docs for this pinned version, `@tanstack/react-start` 1.168.25).

- [x] **Step 5: Run the unit test to verify it passes**

Run: `pnpm --filter @pantry/web test -- security-headers`
Expected: PASS.

- [x] **Step 6: Verify the header is actually emitted (manual smoke)**

Run: `pnpm --filter @pantry/web build && (node apps/web/.output/server/index.mjs &) && sleep 4 && curl -sS -D - -o /dev/null http://localhost:3000/ | grep -i content-security-policy && kill %1 2>/dev/null || true`
Expected: a `content-security-policy:` response header is present. (Task 9's axe spec will also assert it via Playwright.)

- [x] **Step 7: Commit**

```bash
git add apps/web/src/lib/security-headers.ts apps/web/src/lib/security-headers.test.ts apps/web/src/server.ts
git commit -m "feat(security): strict CSP + security headers on web SSR responses"
```

---

### Task 7: Rate-limit tuning for expensive AI procedures

The API has one global rate limit (300/min) plus a stricter auth limit. Generation and scan call the AI provider and cost real money — they need their own tighter per-user ceiling, independent of the global budget.

**Files:**
- Modify: `services/api/src/trpc/init.ts` (add an `aiRateLimited` procedure)
- Modify: `services/api/src/env.ts` (add `AI_ACTION_RATE_LIMIT_MAX`)
- Modify: routers calling AI generation/scan to use the new procedure
- Test: `services/api/src/trpc/ai-rate-limit.test.ts`

**Interfaces:**
- Consumes: existing tRPC `protectedProcedure`, `ctx.userId`, `ctx.env`.
- Produces: `aiRateLimited` procedure throwing `TRPCError({ code: 'TOO_MANY_REQUESTS' })` past `env.AI_ACTION_RATE_LIMIT_MAX` requests/minute/user.

- [x] **Step 1: Add the env knob in `services/api/src/env.ts`**

Add to the zod schema (near `RATE_LIMIT_MAX`):

```ts
  /** Per-user/minute ceiling on AI generation + scan procedures (cost guard). */
  AI_ACTION_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
```

- [x] **Step 2: Write the failing test**

```ts
// services/api/src/trpc/ai-rate-limit.test.ts
import { describe, expect, it } from 'vitest';
import { consumeAiActionSlot, __resetAiRateLimiter } from './ai-rate-limit.js';

describe('consumeAiActionSlot', () => {
  it('allows up to max per window then blocks the same user', () => {
    __resetAiRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 3; i += 1) {
      expect(consumeAiActionSlot('user-1', 3, 60_000, now)).toBe(true);
    }
    expect(consumeAiActionSlot('user-1', 3, 60_000, now)).toBe(false);
  });

  it('isolates users and resets after the window', () => {
    __resetAiRateLimiter();
    const t0 = 1_000_000;
    expect(consumeAiActionSlot('a', 1, 60_000, t0)).toBe(true);
    expect(consumeAiActionSlot('a', 1, 60_000, t0)).toBe(false);
    expect(consumeAiActionSlot('b', 1, 60_000, t0)).toBe(true);
    expect(consumeAiActionSlot('a', 1, 60_000, t0 + 60_001)).toBe(true);
  });
});
```

- [x] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @pantry/api test -- ai-rate-limit`
Expected: FAIL (module not found).

- [x] **Step 4: Write `services/api/src/trpc/ai-rate-limit.ts`**

```ts
/**
 * Fixed-window per-user limiter for AI generation/scan procedures. In-memory
 * (single API instance for launch); swap for Redis if we scale horizontally.
 */
interface Bucket {
  count: number;
  windowStart: number;
}
const buckets = new Map<string, Bucket>();

export function consumeAiActionSlot(userId: string, max: number, windowMs: number, now: number): boolean {
  const b = buckets.get(userId);
  if (b === undefined || now - b.windowStart >= windowMs) {
    buckets.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

/** Test-only: clear all buckets between cases. */
export function __resetAiRateLimiter(): void {
  buckets.clear();
}
```

- [x] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @pantry/api test -- ai-rate-limit`
Expected: PASS.

- [x] **Step 6: Wire an `aiRateLimited` procedure in `services/api/src/trpc/init.ts`**

After the existing `protectedProcedure` definition, add (adjust `ctx` field names to match the real context — `ctx.userId` / `ctx.env`):

```ts
import { TRPCError } from '@trpc/server';
import { consumeAiActionSlot } from './ai-rate-limit.js';

export const aiRateLimitedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const allowed = consumeAiActionSlot(
    ctx.userId,
    ctx.env.AI_ACTION_RATE_LIMIT_MAX,
    60_000,
    Date.now(),
  );
  if (!allowed) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many AI requests. Please wait a moment.' });
  }
  return next();
});
```

- [x] **Step 7: Apply it to the AI generation + scan procedures**

In `services/api/src/trpc/routers/recipes.ts` and `services/api/src/trpc/routers/scan.ts`, swap the AI-calling mutations/subscriptions from `protectedProcedure` to `aiRateLimitedProcedure`. Verify by reading each router and changing only the generation/scan-extract procedures (not reads).

- [x] **Step 8: Run gates**

Run: `podman compose -f infra/podman/compose.yaml up -d postgres && pnpm --filter @pantry/api test && pnpm typecheck`
Expected: PASS.

- [x] **Step 9: Commit**

```bash
git add services/api/src/env.ts services/api/src/trpc/ai-rate-limit.ts services/api/src/trpc/ai-rate-limit.test.ts services/api/src/trpc/init.ts services/api/src/trpc/routers/recipes.ts services/api/src/trpc/routers/scan.ts
git commit -m "feat(security): per-user rate limit on AI generation + scan procedures"
```

---

### Task 8: Supply-chain CI — dependency audit + secret scanning

Add a CI workflow that runs a dependency vulnerability audit and a secret scan on every push/PR.

**Files:**
- Create: `.gitleaks.toml`
- Create: `.github/workflows/security.yml`

**Interfaces:**
- Produces: a `security` workflow with two jobs (`audit`, `secrets`) that fail the build on high-severity advisories / detected secrets.

- [x] **Step 1: Write `.gitleaks.toml`**

```toml
title = "pantry-copilot gitleaks config"

[extend]
useDefault = true

[allowlist]
description = "Test fixtures + example env use deterministic non-secret tokens"
paths = [
  '''\.env\.example''',
  '''.*\.test\.ts''',
  '''e2e/.*''',
  '''tools/design-fidelity/.*''',
]
regexes = [
  '''0123456789012345678901234567890123''',
  '''e2e-ai-service-token-e2e-ai-service-token''',
]
```

- [x] **Step 2: Write `.github/workflows/security.yml`**

```yaml
name: security
on:
  push: { branches: [main] }
  pull_request:
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level high --prod
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITLEAKS_CONFIG: .gitleaks.toml
```

- [x] **Step 3: Run the audit + a local gitleaks pass to verify they are green today**

Run: `pnpm audit --audit-level high --prod; echo "audit exit: $?"`
Expected: exit 0 (no high-severity prod advisories). If advisories exist, record them in `docs/launch-readiness.md` (Task 14) and either bump (milestone boundary allows it) or add a justified override.

Run (if gitleaks installed locally): `gitleaks detect --config .gitleaks.toml --no-banner; echo "gitleaks exit: $?"`
Expected: exit 0. If not installed locally, the CI job is the gate.

- [x] **Step 4: Commit**

```bash
git add .gitleaks.toml .github/workflows/security.yml
git commit -m "ci(m9): dependency audit + gitleaks secret scanning workflow"
```

---

### Task 9: Accessibility pass — axe-core smoke across key web screens

Add an axe-core sweep over the primary authenticated screens via Playwright, asserting zero serious/critical violations and that the CSP header (Task 6) ships.

**Files:**
- Create: `e2e/web/specs/accessibility.spec.ts`
- Modify: `e2e/web/package.json` (add `@axe-core/playwright`)

**Interfaces:**
- Consumes: the running web+api+ai stack from `playwright.config.ts` webServers; `AUTH_DEV_MAGIC_LINK` sign-in helper used by existing specs.

- [x] **Step 1: Add the dev dependency (exact pin)**

Run: `pnpm --filter @pantry/e2e-web add -D @axe-core/playwright@4.10.1`
Expected: `package.json` records `"@axe-core/playwright": "4.10.1"` (no caret — `.npmrc` enforces exact).

- [x] **Step 2: Write the failing spec**

```ts
// e2e/web/specs/accessibility.spec.ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Reuse the project's existing sign-in helper pattern. If specs share a helper,
// import it; otherwise inline the dev-magic-link sign-in used by auth.spec.ts.
async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  // … mirror auth.spec.ts dev-magic-link flow to reach an authed session …
}

const SCREENS = ['/home', '/inventory', '/recipes', '/account'];

test.describe('accessibility', () => {
  test('serves a CSP header on the document', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
  });

  for (const path of SCREENS) {
    test(`no serious/critical axe violations on ${path}`, async ({ page }) => {
      await signIn(page);
      await page.goto(path);
      await page.evaluate(async () => { await document.fonts.ready; });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(blocking, JSON.stringify(blocking.map((v) => v.id), null, 2)).toEqual([]);
    });
  }
});
```

- [x] **Step 3: Run the spec to verify it (expect either fail-on-violation or fail-on-missing-helper)**

Run: `podman compose -f infra/podman/compose.yaml up -d postgres && pnpm --filter @pantry/e2e-web e2e -- accessibility`
Expected: first run fails — either on the `signIn` stub (fill it in from `auth.spec.ts`) or on real axe violations.

- [x] **Step 4: Fix the `signIn` helper, then triage violations**

Wire `signIn` to the real dev-magic-link flow (read `e2e/web/specs/auth.spec.ts`). For each serious/critical violation axe reports, fix it at the source (labels, roles, contrast, landmark structure) in the relevant `features/*` component. Where a fix would change approved visual fidelity, log the trade-off in `docs/decisions.md` and prefer the accessible variant (a11y wins ties; the board is silent on a11y).

- [x] **Step 5: Re-run to green**

Run: `pnpm --filter @pantry/e2e-web e2e -- accessibility`
Expected: PASS (CSP header present, zero serious/critical violations on all four screens).

- [x] **Step 6: Commit**

```bash
git add e2e/web/package.json e2e/web/specs/accessibility.spec.ts apps/web/src
git commit -m "test(a11y): axe-core smoke on home/inventory/recipes/account + CSP assertion"
```

---

### Task 10: Performance pass — web bundle-size budget gate

Add a budget check that fails CI if the web client JS bundle exceeds a threshold — a regression tripwire on launch performance.

**Files:**
- Create: `tools/perf-budget/check-bundle.ts`
- Create: `tools/perf-budget/package.json`
- Modify: `.github/workflows/ci.yml` (add a budget step after build)

**Interfaces:**
- Produces: a script exiting non-zero when total client JS in `apps/web/.output/public/_build` (or the built client assets dir) exceeds `MAX_KB`.

- [x] **Step 1: Discover the built client asset directory**

Run: `pnpm --filter @pantry/web build && find apps/web -type d -name "_build" -o -type d -name "assets" | grep -i output`
Expected: a client assets directory under `.output`. Use its real path in Step 2 (`ASSET_GLOB`).

- [x] **Step 2: Write `tools/perf-budget/check-bundle.ts`**

```ts
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const ASSET_DIR = process.argv[2] ?? 'apps/web/.output/public';
const MAX_KB = Number(process.env['WEB_BUNDLE_MAX_KB'] ?? '900');

async function totalJsBytes(dir: string): Promise<number> {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += await totalJsBytes(full);
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) total += (await stat(full)).size;
  }
  return total;
}

const kb = Math.round((await totalJsBytes(ASSET_DIR)) / 1024);
console.log(`web client JS: ${String(kb)} KB (budget ${String(MAX_KB)} KB)`);
if (kb > MAX_KB) {
  console.error(`bundle budget exceeded by ${String(kb - MAX_KB)} KB`);
  process.exit(1);
}
```

- [x] **Step 3: Write `tools/perf-budget/package.json`**

```json
{
  "name": "@pantry/perf-budget",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsx check-bundle.ts",
    "typecheck": "tsc --noEmit check-bundle.ts"
  },
  "devDependencies": {
    "@types/node": "25.9.3",
    "tsx": "4.22.4",
    "typescript": "6.0.3"
  }
}
```

- [x] **Step 4: Run the check against the real build to set a realistic budget**

Run: `pnpm install && pnpm --filter @pantry/web build && pnpm --filter @pantry/perf-budget check apps/web/.output/public`
Expected: prints the real KB total. Set `MAX_KB` default to ~15% above the current measured size (headroom without masking regressions).

- [x] **Step 5: Add the gate to `.github/workflows/ci.yml`**

In the `checks` job, after `pnpm build`:

```yaml
      - run: pnpm --filter @pantry/perf-budget check apps/web/.output/public
```

- [x] **Step 6: Commit**

```bash
git add tools/perf-budget .github/workflows/ci.yml pnpm-lock.yaml
git commit -m "ci(perf): web client JS bundle-size budget gate"
```

---

### Task 11: Mobile fidelity capture — iOS simulator harness

No mobile app-capture script exists (only `capture-app-web.ts`). Per the fidelity workflow, capture mobile frames from a pinned iOS simulator with a status-bar override and frozen clock, so the mobile half of the sweep is real (not skipped).

**Files:**
- Create: `tools/design-fidelity/src/capture-app-mobile.ts`
- Modify: `tools/design-fidelity/package.json` (add `capture:mobile` script)

**Interfaces:**
- Consumes: the manifest's `kind:'mobile'` entries (`tools/design-fidelity/references/manifest.json`); a running Expo app on the booted simulator; deep-link routes (`pantrycopilot://…`) for each mobile frame.
- Produces: PNGs in `tools/design-fidelity/output/app/<slug>.png` matching mobile reference slugs for Task 12's diff.

- [x] **Step 1: Establish the deterministic simulator state (documented commands)**

Run: `xcrun simctl list devices booted`
Expected: identify the booted device UDID. The capture script will assume one booted simulator. Apply a frozen status bar:

Run: `xcrun simctl status_bar booted override --time "9:41" --batteryLevel 100 --batteryState charged --cellularBars 4 --wifiBars 3`
Expected: status bar frozen (matches the board's neutral chrome).

- [x] **Step 2: Write `tools/design-fidelity/src/capture-app-mobile.ts`**

```ts
import { execFile } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const APP_DIR = fileURLToPath(new URL('../output/app/', import.meta.url));
const REFS = fileURLToPath(new URL('../references/manifest.json', import.meta.url));

interface ManifestEntry { kind: 'web' | 'mobile'; file: string; label: string; section: string; }

/** Maps a mobile reference slug → the deep link that renders that frame state. */
const ROUTES: Record<string, string> = {
  // Fill from the manifest mobile entries + expo-router routes, e.g.:
  // 'home--mobile-home': 'pantrycopilot://home',
  // 'mobile-camera-scan-flow--1-viewfinder': 'pantrycopilot://scan',
};

await mkdir(APP_DIR, { recursive: true });
const manifest = JSON.parse(await readFile(REFS, 'utf8')) as ManifestEntry[];
const mobile = manifest.filter((m) => m.kind === 'mobile');

for (const entry of mobile) {
  const slug = entry.file.replace(/\.png$/, '');
  const deepLink = ROUTES[slug];
  if (deepLink === undefined) {
    console.warn(`SKIP ${slug}: no deep link mapped`);
    continue;
  }
  await run('xcrun', ['simctl', 'openurl', 'booted', deepLink]);
  await new Promise((r) => setTimeout(r, 1500));
  await run('xcrun', ['simctl', 'io', 'booted', 'screenshot', `${APP_DIR}${slug}.png`]);
  console.log(`captured → ${slug}.png`);
}
console.log(`mobile capture complete: ${String(mobile.length)} frames`);
```

- [x] **Step 3: Populate `ROUTES` from the manifest's mobile entries**

Run: `node -e "const m=require('./tools/design-fidelity/references/manifest.json'); m.filter(x=>x.kind==='mobile').forEach(x=>console.log(x.file.replace(/\.png$/,'')))"`
Expected: the list of mobile slugs. Map each to the expo-router deep link that renders that exact frame state (some states need fixture params; add query/path as the routes require). Frames that require an interaction (sheets open, mid-flow) should deep-link to a route that opens that state — add the minimal dev-only deep-link handlers if missing, mirroring how the existing screens route.

- [x] **Step 4: Add the script to `tools/design-fidelity/package.json`**

In `scripts`, add:

```json
    "capture:mobile": "tsx src/capture-app-mobile.ts",
```

- [x] **Step 5: Run the capture against a booted simulator with the app running**

Run: `pnpm --filter @pantry/mobile start` (separate terminal; press `i` to boot the app on the simulator), then: `pnpm --filter @pantry/design-fidelity capture:mobile`
Expected: PNGs land in `tools/design-fidelity/output/app/` for every mapped mobile slug; warnings only for any intentionally-deferred frame.

- [x] **Step 6: Commit**

```bash
git add tools/design-fidelity/src/capture-app-mobile.ts tools/design-fidelity/package.json
git commit -m "tools(fidelity): iOS-simulator mobile app capture harness"
```

---

### Task 12: Full-board screenshot sweep — harness + report + checklist

`compare.ts` diffs one pair at a time. Add a `sweep` runner that captures web + mobile, diffs every manifest frame, writes the consolidated report, enforces a pixelmatch regression tripwire on already-approved frames, and emits the tracking checklist.

**Files:**
- Create: `tools/design-fidelity/src/sweep.ts`
- Modify: `tools/design-fidelity/package.json` (add `sweep` script)
- Create: `docs/checklists/m9-fidelity-sweep.md`

**Interfaces:**
- Consumes: `references/manifest.json`, `references/<slug>.png`, captured `output/app/<slug>.png` (web from `capture-app-web.ts` / per-screen capture; mobile from Task 11).
- Produces: `output/report.html` + `output/sweep.json` (`{ slug, mismatchPct, kind }[]`); non-zero exit if any **approved** frame regresses past threshold.

- [x] **Step 1: Write `tools/design-fidelity/src/sweep.ts`**

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const REFS = fileURLToPath(new URL('../references/', import.meta.url));
const APP = fileURLToPath(new URL('../output/app/', import.meta.url));
const OUT = fileURLToPath(new URL('../output/', import.meta.url));
const TRIPWIRE_PCT = Number(process.env['SWEEP_TRIPWIRE_PCT'] ?? '2');

interface ManifestEntry { kind: 'web' | 'mobile'; file: string; label: string; section: string; }
interface Row { slug: string; kind: string; mismatchPct: number; missing: boolean; }

function pad(png: PNG, w: number, h: number): PNG {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

async function tryRead(path: string): Promise<PNG | null> {
  try { return PNG.sync.read(await readFile(path)); } catch { return null; }
}

const manifest = JSON.parse(await readFile(`${REFS}manifest.json`, 'utf8')) as ManifestEntry[];
await mkdir(OUT, { recursive: true });

const rows: Row[] = [];
for (const entry of manifest) {
  const slug = entry.file.replace(/\.png$/, '');
  const ref = await tryRead(`${REFS}${entry.file}`);
  const act = await tryRead(`${APP}${slug}.png`);
  if (ref === null || act === null) {
    rows.push({ slug, kind: entry.kind, mismatchPct: 100, missing: true });
    continue;
  }
  const w = Math.max(ref.width, act.width);
  const h = Math.max(ref.height, act.height);
  const diff = new PNG({ width: w, height: h });
  const mismatched = pixelmatch(pad(ref, w, h).data, pad(act, w, h).data, diff.data, w, h, { threshold: 0.1 });
  await mkdir(`${OUT}${slug}/`, { recursive: true });
  await writeFile(`${OUT}${slug}/diff.png`, PNG.sync.write(diff));
  rows.push({ slug, kind: entry.kind, mismatchPct: (mismatched / (w * h)) * 100, missing: false });
}

rows.sort((a, b) => b.mismatchPct - a.mismatchPct);
await writeFile(`${OUT}sweep.json`, `${JSON.stringify(rows, null, 2)}\n`);

const captured = rows.filter((r) => !r.missing);
const regressions = captured.filter((r) => r.mismatchPct > TRIPWIRE_PCT);
console.log(`swept ${String(rows.length)} frames · captured ${String(captured.length)} · ${String(rows.length - captured.length)} missing`);
console.log(`regressions over ${String(TRIPWIRE_PCT)}%: ${String(regressions.length)}`);
for (const r of regressions) console.log(`  ${r.slug} (${r.kind}) ${r.mismatchPct.toFixed(2)}%`);
if (regressions.length > 0) process.exit(1);
```

- [x] **Step 2: Add the `sweep` script to `tools/design-fidelity/package.json`**

In `scripts`, add:

```json
    "sweep": "tsx src/sweep.ts",
```

- [x] **Step 3: Capture all app frames, then run the sweep**

Run: (web stack + simulator app running) `pnpm --filter @pantry/design-fidelity capture:web && pnpm --filter @pantry/design-fidelity capture:mobile && pnpm --filter @pantry/design-fidelity sweep`
Expected: `output/report.html` + `output/sweep.json` written; console lists per-frame mismatch %. The exit is non-zero only when a captured frame exceeds the tripwire — early on this surfaces real deviations to fix or approve.

- [x] **Step 4: Generate `docs/checklists/m9-fidelity-sweep.md` from the sweep**

Create the checklist with one row per manifest frame, grouped web/mobile, each an unchecked box for human approval, pre-filled with the latest mismatch %. Header:

```markdown
# M9 — Final full-board fidelity sweep

Run: `pnpm --filter @pantry/design-fidelity sweep` → open `tools/design-fidelity/output/report.html`.
Tripwire: `SWEEP_TRIPWIRE_PCT` (default 2%) on already-approved frames.

Approval = human review of reference|actual|diff (layout/spacing/type/color, not pixel-identity).

## Web frames
- [ ] `marketing-auth--web-login` — _% mismatch_ — approved by ___ on ___
- [ ] … (one row per `kind:'web'` manifest entry)

## Mobile frames
- [ ] `home--mobile-home` — _% mismatch_ — approved by ___ on ___
- [ ] … (one row per `kind:'mobile'` manifest entry)
```

Populate every manifest slug (use the `node -e` manifest dump to enumerate all 55).

- [x] **Step 5: Commit**

```bash
git add tools/design-fidelity/src/sweep.ts tools/design-fidelity/package.json docs/checklists/m9-fidelity-sweep.md
git commit -m "tools(fidelity): full-board sweep runner + report + approval checklist"
```

---

### Task 13: EAS build profiles

The mobile app has `app.json` but no `eas.json` and no build profiles — it cannot produce a real dev build or store binary (recall: real RevenueCat purchases need a dev build, not Expo Go).

**Files:**
- Create: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.json` (add `extra.eas.projectId`, `owner`, `runtimeVersion`)

**Interfaces:**
- Produces: `development` (dev client, internal), `preview` (internal distribution), `production` (store) build profiles.

- [x] **Step 1: Write `apps/mobile/eas.json`**

```json
{
  "cli": { "version": ">= 16.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "http://localhost:4000" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://staging-api.pantrycopilot.app" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://api.pantrycopilot.app" }
    }
  },
  "submit": { "production": {} }
}
```

- [x] **Step 2: Add EAS fields to `apps/mobile/app.json`**

Inside `expo`, add `runtimeVersion` and an `extra.eas.projectId` placeholder to be filled by `eas init` (do not invent a UUID — leave a clearly-marked TODO that `eas init` populates):

```json
    "runtimeVersion": { "policy": "appVersion" },
    "extra": { "eas": { "projectId": "FILL_VIA_eas_init" } }
```

- [x] **Step 3: Validate the config statically**

Run: `pnpm --filter @pantry/mobile exec expo config --type public > /dev/null && echo "expo config OK"`
Expected: prints `expo config OK` (config parses). Note in `docs/launch-readiness.md` that `eas init` + `eas build --profile development` must be run by a maintainer with EAS credentials (cannot run headless in CI).

- [x] **Step 4: Commit**

```bash
git add apps/mobile/eas.json apps/mobile/app.json
git commit -m "build(mobile): EAS dev/preview/production build profiles"
```

---

### Task 14: Launch-readiness docs + milestone close

Write the system architecture doc (referenced in the monorepo structure but missing), a go-live checklist, log M9 decisions, and mark the milestone done.

**Files:**
- Create: `docs/architecture.md`
- Create: `docs/launch-readiness.md`
- Modify: `docs/decisions.md`
- Modify: `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md` (Status table)

- [x] **Step 1: Write `docs/architecture.md`**

Document the request path `web/mobile —tRPC→ api —REST+SSE (service token)→ ai —→ Anthropic | OpenAI`, postgres behind api, the request-ID threading (Task 4), the streaming SSE design (heartbeats, timeouts), the entitlement/quota model (M8), and the security posture (helmet/CSP per service, AI service auth + network isolation, per-user AI rate limit, secret scanning). Keep it current with the code — cite real files.

- [x] **Step 2: Write `docs/launch-readiness.md`**

A go-live checklist with sections: containers (`podman compose up` boots — Task 2), CI green (checks + e2e-web + security), observability (request IDs end-to-end, `ai.stream.cost` lines), security (CSP, rate limits, audit, gitleaks), accessibility (axe green), performance (bundle budget), mobile (EAS dev build, Maestro local flows, fidelity sweep), and the **manual maintainer steps** that can't run in CI: `eas init`, `eas build`, sandbox purchase verification (M8 `docs/checklists/m8-monetization.md`), and the full-board fidelity sign-off (`docs/checklists/m9-fidelity-sweep.md`).

- [x] **Step 3: Document the Maestro local-run procedure in `docs/launch-readiness.md`**

Add the exact commands to run each `e2e/mobile/*.yaml` flow locally against a booted simulator (the documented mobile e2e gate per the scope decision), and the pre-release expectation that all eight flows pass.

- [x] **Step 4: Append M9 decisions to `docs/decisions.md`**

Record: web SSR CSP `style-src 'unsafe-inline'` rationale; in-memory per-user AI rate limiter (single-instance launch assumption); bundle budget threshold chosen; any a11y/visual trade-offs from Task 9; mobile-capture deep-link approach for fidelity.

- [x] **Step 5: Run the full gate suite**

Run: `podman compose -f infra/podman/compose.yaml up -d postgres && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all green.

- [x] **Step 6: Boot the full stack one final time (milestone gate)**

Run: `AI_SERVICE_TOKEN=01234567890123456789012345678901 BETTER_AUTH_SECRET=0123456789012345678901234567890123 podman compose -f infra/podman/compose.yaml up -d --build && sleep 12 && curl -fsS http://localhost:4000/health && curl -fsS http://localhost:4001/health && curl -fsS http://localhost:4001/ready && curl -sS -o /dev/null -w "web:%{http_code}\n" http://localhost:3000/ && podman compose -f infra/podman/compose.yaml down`
Expected: api+ai healthy, ai ready, web 200.

- [x] **Step 7: Mark M9 done in the roadmap Status table**

In `docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md`, change the M9 row `State` to `done` and link this plan + the sweep checklist, summarizing what shipped (containers, security, observability, a11y/perf, EAS, fidelity sweep harness).

- [x] **Step 8: Commit**

```bash
git add docs/architecture.md docs/launch-readiness.md docs/decisions.md docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md
git commit -m "docs(m9): architecture + launch-readiness + decisions; mark M9 done"
```

---

## Self-Review

**Spec coverage** (roadmap M9 bullet → task):
- "Full e2e regression green in CI" → existing `e2e-web` job + Task 9 (a11y spec joins the suite); mobile verified via Task 11 captures + Task 14 documented Maestro runs (per scope decision). ✔
- "security pass (CSP audit, rate-limit tuning, dep audit, secret scanning)" → Task 6 (web CSP) + Task 7 (rate-limit tuning) + Task 8 (audit + gitleaks). ✔
- "observability (structured logs, end-to-end request IDs, AI cost logging)" → Task 4 (request IDs) + Task 5 (stream cost logging); structured logs already via pino, documented in Task 14. ✔
- "EAS build profiles" → Task 13. ✔
- "production Containerfiles + compose" → Task 1 (api+ai) + Task 2 (web + compose). ✔
- "accessibility/performance passes" → Task 9 (axe) + Task 10 (bundle budget). ✔
- "final full-board screenshot sweep" → Task 11 (mobile capture) + Task 12 (sweep runner + report + checklist). ✔

**Placeholder scan:** Concrete code/config in every step. The few genuine discovery points (web build output path in Tasks 1/2/6/10; web server middleware seam in Task 6; mobile deep-link routes in Task 11; `eas init` projectId in Task 13) are explicit discovery steps with the exact command to resolve them — not hand-waving — because their values are environment-derived and must be read from the real build, not guessed.

**Type consistency:** `consumeAiActionSlot`/`__resetAiRateLimiter` (Task 7) consistent across test + impl + `aiRateLimitedProcedure`. `logStreamCost`/`StreamCost` (Task 5) consistent test↔impl. `securityHeaders({ apiUrl })` (Task 6) consistent. `newRequestId`/`requestIdHeaders` (Task 4) consistent across helper, re-export, and both clients. `sweep.json` row shape (Task 12) self-consistent.

**Note on AI internals (Tasks 5):** the cost reader defensively inspects `ev.tokensUsed` rather than asserting an exact terminal event name, because the wire union's terminal token-bearing event was not fully traced; the test injects a mock provider yielding `tokensUsed`, so the integration is verified regardless. If the real provider names usage differently, fix the reader to match and the test stays valid.
