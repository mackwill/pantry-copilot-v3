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
- [ ] Full-board fidelity sign-off: web frames are captured autonomously
      (`pnpm --filter @pantry/design-fidelity capture:web:all`, 0/18 missing);
      mobile needs the simulator procedure below. Then
      `pnpm --filter @pantry/design-fidelity sweep`, open
      `tools/design-fidelity/output/report.html`, and record approvals in
      `docs/checklists/m9-fidelity-sweep.md`.

### Mobile fidelity capture (simulator)

Captures the 11 `[deep-link]` mobile frames (see `m9-fidelity-sweep.md`); the
26 `[needs dev deep-link]` frames are deferred until the app exposes dev-only
deep links for its mid-flow / state-dependent views. Each screenshot is
auto-resized to its reference width (`sips`), and the sweep scales any residual
size mismatch via `normalizeForDiff` — so a captured mobile frame reads as a
meaningful single/low-double-digit %, not the old ~60% scale artifact.

**Capture method:** `simctl openurl pantrycopilot://…` does **not** route on the
installed dev build (iOS "Open in app?" prompt + expo-dev-client intercepts the
scheme → grey screen). Drive the app with **Maestro UI navigation** instead.

```bash
# 1. Boot + freeze a simulator for deterministic chrome.
xcrun simctl boot "iPhone 15" 2>/dev/null || true
xcrun simctl status_bar booted override --time "9:41" \
  --batteryLevel 100 --batteryState charged --cellularBars 4 --wifiBars 3
# 2. Metro + a real dev client (Expo Go won't host the dev build's scheme).
pnpm --filter @pantry/mobile exec expo start --dev-client
# 3. Sign in once (creates the maestro user first if needed — see sign-in.yaml).
export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home
export PATH="$HOME/.maestro/bin:$PATH"
maestro test e2e/mobile/sign-in.yaml
# 4. Capture the tab-reachable frames, resize to reference width, sweep.
cd tools/design-fidelity
maestro test maestro/fidelity-capture.yaml          # writes <slug>.png to cwd
for s in *--mobile-*.png; do slug=${s%.png}; \
  w=$(sips -g pixelWidth references/$slug.png | awk '/pixelWidth/{print $2}'); \
  sips --resampleWidth "$w" "$s" >/dev/null; mv "$s" output/app/; done
pnpm --filter @pantry/design-fidelity sweep
```

Captures 6 frames (home, pantry, cook library, account, scan viewfinder,
add-ingredient). **login** is captured separately by invalidating the session —
`psql … -c "delete from sessions s using users u where s.user_id=u.id and
u.email='maestro@example.com'"` then relaunch (the in-app sign-out button does
not end the session on this build). The remaining 4 `[deep-link]` frames need
app-side fixes (tracked in `m9-fidelity-sweep.md`): **result** (mobile
generation errors — "hit a snag", stream 0.0s) and **paywall / trial / manage**
(no in-app entry point, and deep links don't route). The `[needs dev deep-link]`
frames remain deferred.
