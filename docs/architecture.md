# Pantry CoPilot v3 — System Architecture

This documents the runtime shape of the stack as of M9. Keep it current with the
code; it cites real files.

## Request path

```
web (TanStack Start SSR)  ─┐
                           ├─ tRPC (superjson) ─→  api (Fastify)  ─ REST + SSE ─→  ai (Fastify)  ─→  Anthropic | OpenAI
mobile (Expo / expo-router)┘                         │   (Bearer AI_SERVICE_TOKEN)
                                                     └─ Drizzle ─→  PostgreSQL
```

- **Clients** (`apps/web`, `apps/mobile`) talk only to the **api** via one typed
  tRPC client (`packages/api-client`). Subscriptions (recipe generation/tweak)
  use `httpSubscriptionLink` (SSE); everything else batches over HTTP.
- **api** (`services/api`) is the only service with a database. It owns auth
  (Better Auth), the tRPC routers (`src/trpc/routers/*`), entitlements/quota, and
  is the only caller of **ai**. It reaches **ai** over the private network
  presenting `Authorization: Bearer ${AI_SERVICE_TOKEN}`.
- **ai** (`services/ai`) is stateless and network-isolated. It wraps the model
  providers (`src/providers/*`, mock/anthropic/openai with `withFallback`) and
  exposes REST extraction (`/scans`) + SSE streams (`/recipes/*`). It never
  touches the database and holds the provider API keys.
- **PostgreSQL** sits behind **api** only (Drizzle ORM; migrations in
  `services/api/drizzle`, applied on container start via `dist/migrate.js`).

## Observability

- **End-to-end request IDs.** Clients mint an `x-request-id` per request
  (`packages/api-client/src/request-id.ts`); api honours an inbound id
  (`genReqId`) and forwards it to ai, which echoes it on the response and stamps
  every log line. One user action is traceable web/mobile → api → ai.
- **Structured logs** via pino on both services.
- **AI cost logging.** ai emits one structured line per call:
  `ai.extract.cost` for image scans and `ai.stream.cost` for generation/tweak
  streams (provider, model, tokens, duration, outcome) —
  `services/ai/src/lib/log.ts`, instrumented in `src/routes/recipes.ts`.

## Streaming (SSE) design

`pipeSseStream` (`services/ai/src/routes/recipes.ts`) is the shared plumbing for
the generation and tweak streams:

- `:` heartbeat comment every 10s so proxies/NAT don't drop idle connections.
- Client-disconnect detection on the **response** socket (not `req.raw`, which
  Fastify closes early after consuming the POST body).
- A hard provider timeout (`AI_PROVIDER_TIMEOUT_MS`) that aborts the stream with
  a terminal `error` frame.
- A `finally` that always emits the cost line and ends the response.

The api re-streams these to clients through the tRPC subscription link.

## Entitlements & quota (M8)

api enforces a weekly quota (reset Sunday 00:00 UTC) and a three-tier
`free/basic/pro` entitlement mirror (derived `isPro`), fed by an idempotent
RevenueCat webhook (dedupe on `event.id`) plus a top-up credit ledger. Generation
and scan procedures are gated before they reach ai. See the M8 plan/decisions.

## Security posture

- **Helmet** on api and ai; **strict CSP + security headers** on every web SSR
  document (`apps/web/src/lib/security-headers.ts`, applied via the global
  request middleware in `apps/web/src/start.ts`; relaxed only for the Vite dev
  server). The web start instance re-registers Start's CSRF middleware.
- **AI service auth.** ai rejects unauthenticated `/scans`+`/recipes` calls; the
  token is shared only with api. ai is otherwise network-isolated.
- **Rate limits.** A global per-IP limit + a stricter auth limit on api, plus a
  per-user/minute ceiling on the AI generation + scan procedures
  (`services/api/src/trpc/ai-rate-limit.ts`, `AI_ACTION_RATE_LIMIT_MAX`) since
  those cost real money.
- **Readiness.** Both services expose `/health`; ai also exposes `/ready`, which
  503s when the selected provider needs an API key that isn't configured.
- **Supply chain.** CI runs `pnpm audit --audit-level high --prod` and gitleaks
  secret scanning (`.github/workflows/security.yml`).
- **Env fail-fast.** Zod-validated env on every service; no dev auto-login in
  production.

## Containers

Production multi-stage Containerfiles for api, ai, and web. The api and ai images
bundle their `@pantry/*` workspace deps (tsup, `noExternal`) so `node dist` runs
no TypeScript at runtime; web serves the TanStack Start build via `serve.mjs`
(srvx: static-first, SSR fallthrough). `infra/podman/compose.yaml` boots the full
stack (postgres + api + ai + web) with healthchecks and `depends_on` gating.
