# Launch Readiness — Pantry CoPilot v3

Go-live checklist. Automated items are gated in CI; **manual maintainer steps**
at the bottom cannot run headless and must be done by someone with the right
credentials/hardware.

## Containers
- [ ] `podman compose -f infra/podman/compose.yaml up -d --build` boots the full
      stack (postgres + api + ai + web). Verify:
      `curl -fsS localhost:4000/health`, `curl -fsS localhost:4001/health`,
      `curl -fsS localhost:4001/ready`, `curl -sS -o /dev/null -w "%{http_code}" -L localhost:3000/` (→ 200).
- [ ] Production secrets supplied via the root `.env` / `ENV_FILE` (never baked
      into images): `BETTER_AUTH_SECRET`, `AI_SERVICE_TOKEN`, provider keys,
      RevenueCat keys.

## CI green
- [ ] `ci` workflow: lint, typecheck, test, build, web bundle budget, e2e-web.
- [ ] `security` workflow: `pnpm audit --audit-level high --prod` + gitleaks.

## Observability
- [ ] Request IDs thread web/mobile → api → ai (one `x-request-id` per action).
- [ ] `ai.extract.cost` + `ai.stream.cost` log lines present in ai logs.

## Security
- [ ] Web responses carry CSP + `X-Frame-Options`/nosniff/HSTS/Referrer-Policy
      (strict in production; relaxed only for the dev server).
- [ ] AI service rejects unauthenticated `/scans`+`/recipes`; ai is network-isolated.
- [ ] Per-user AI rate limit active (`AI_ACTION_RATE_LIMIT_MAX`).
- [ ] No high-severity prod advisories (see audit note below).

## Accessibility
- [ ] `pnpm --filter @pantry/e2e-web e2e -- accessibility` green (zero
      serious/critical axe violations on home/pantry/recipes/settings; CSP asserted).

## Performance
- [ ] `pnpm --filter @pantry/perf-budget check` under budget (1500 KB client JS).

## Mobile
- [ ] EAS profiles validate (`expo config --type public`).
- [ ] Maestro flows pass locally (procedure below).
- [ ] Fidelity sweep captured + signed off (`docs/checklists/m9-fidelity-sweep.md`).

## Maestro local-run procedure (mobile e2e)

Documented mobile e2e gate (per M9 scope decision — not a macOS CI runner).
Prerequisites: a booted iOS simulator, the Expo app running
(`pnpm --filter @pantry/mobile start`, press `i`), and `JAVA_HOME` set (Maestro
needs a JRE). Run each flow against the booted app:

```bash
for flow in sign-in pantry scan generation library cook recipe-chat paywall; do
  maestro test e2e/mobile/$flow.yaml
done
```

Pre-release expectation: **all eight flows pass**.

## Dependency audit note
`pnpm audit --audit-level high --prod` is clean after forcing `undici >= 7.28.0`
via a pnpm override (root `package.json`) — it cleared 3 high-severity advisories
that entered transitively through jsdom. Remaining low/moderate advisories are
below the gate threshold; re-review at the next dependency-bump boundary.

## Manual maintainer steps (cannot run in CI)
- [ ] `eas init` to populate `apps/mobile/app.json` → `extra.eas.projectId`
      (currently the `FILL_VIA_eas_init` placeholder), then
      `eas build --profile development` for a real dev client (required for real
      RevenueCat purchases — Expo Go no-ops them).
- [ ] Sandbox purchase verification (`docs/checklists/m8-monetization.md`).
- [ ] Full-board fidelity sign-off: `pnpm --filter @pantry/design-fidelity sweep`,
      open `tools/design-fidelity/output/report.html`, record approvals in
      `docs/checklists/m9-fidelity-sweep.md`. Web frames captured via
      `capture:web`; mobile via `capture:mobile` against the booted simulator.
