# M3 — AI service v1 + camera scan: fidelity checklist

The 4 M3 board reference frames (board §08, mobile-only, 390×800) are captured and
committed under `tools/design-fidelity/references/` (section
`Mobile · Camera scan flow` in `references/manifest.json`; regenerated headlessly
via `pnpm -C tools/design-fidelity capture:references`).

**Visual side-by-side approval is PENDING interactive review** — the app-side
capture (`xcrun simctl io screenshot` on the pinned simulator, status-bar
override + frozen clock per the M1/M2 method) and the human side-by-side gate
require a simulator and the running stack (api on :4000 + ai on :4001 with
`DEFAULT_AI_PROVIDER=mock`). The Detecting and Review frames are deterministic
via the mock provider; the Viewfinder/Detecting frames render over the
board-reproduced fixture scene (no camera in the simulator). Approve each row
below when the capture is taken and compared.

| # | Frame (board §08) | Reference | Platform | Status |
| - | ----------------- | --------- | -------- | ------ |
| 1 | Viewfinder (step 1/4) | `mobile-camera-scan-flow--1-viewfinder.png` | mobile | references captured · visual approval pending |
| 2 | Detecting (step 2/4) | `mobile-camera-scan-flow--2-detecting.png` | mobile | references captured · visual approval pending |
| 3 | Review items (step 3/4) | `mobile-camera-scan-flow--3-review-items.png` | mobile | references captured · visual approval pending |
| 4 | Added to pantry (step 4/4) | `mobile-camera-scan-flow--4-added-to-pantry.png` | mobile | references captured · visual approval pending |

## Functional verification (done, green)

- **Unit/contract:** contracts scan DTO tests (27 total); AI service mock-provider
  + normalization + `/scans/extract` route + service-token-auth + `withFallback`
  tests (26 total); mobile `useScanFlow` hook tests (6).
- **API integration (ephemeral postgres):** `services/api/test/scan.integration.test.ts`
  — `scan.extract` persists a `succeeded` `image_scans` row + returns items;
  UNAUTHORIZED without a session; `scan.confirm` writes the selected subset into
  `pantry_items` (+ `added` inventory events) and flips the scan to `confirmed`;
  foreign scan → NOT_FOUND. Posts the committed `test/fixtures/scan-sample.jpg`.
- **Types & lint:** `pnpm typecheck` (0 errors, all workspaces incl. new
  `services/ai`) and `pnpm lint` (`--max-warnings 0`, no `eslint-disable`/`any`).
  Every scan component ≤176 LOC (target 200); route files composition-only.
- **Build:** `pnpm -r build` succeeds (incl. `services/ai`).
- **DB:** `0002_misty_genesis` migration applies cleanly on a fresh DB; `image_scans` present.
- **Service isolation (verified locally):** ai `/health` open (200); `/scans/extract`
  rejects unauthenticated (401); incoming `x-request-id` echoed/propagated; a cost
  log line is emitted per extraction. `podman compose config` includes postgres + api + ai.

## Maestro (mobile)

`e2e/mobile/scan.yaml` — launch → sign in → open the scan flow → use the dev
sample-image intake (no camera) → assert "Detecting" → assert the review list
("Found … things.") → tap "Add … to pantry" → assert the "Pantry updated" success
screen. Local/Expo-Go verification pending (CI execution deferred, per the M1/M2
precedent). Precondition: api on :4000 + ai on :4001 (`DEFAULT_AI_PROVIDER=mock`),
maestro user signed in.

## Known fidelity notes (see decisions.md, 2026-06-14)

- Viewfinder/Detecting backgrounds reproduce the board's CSS-gradient fake scene
  with RN `View`s (dark `#0A0A08` + blurred colored rects); the scan-green reticle
  uses the board's dark-context `#A4C46B` rather than the light app accent token.
- The Review "Scan complete" pill is text-only (our RN `Pill` wraps children in a
  `Text`, so the board's inline check glyph is omitted to avoid SVG-in-Text).
- The Review pencil is a visible affordance whose inline-edit sheet is a follow-up;
  `useScanFlow.editRow` exists and is unit-tested for when it is wired.
- "Added" CTAs are stubs until M4 (see decisions.md).
