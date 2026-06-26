# M9 — Final full-board fidelity sweep

Run: `pnpm --filter @pantry/design-fidelity sweep` → open `tools/design-fidelity/output/report.html`.
Tripwire: `SWEEP_TRIPWIRE_PCT` (default 2%) on already-approved frames.

Approval = human review of reference│actual│diff (layout/spacing/type/color, not pixel-identity).
Mismatch %s below are pre-filled from the latest sweep; `not captured` means the
frame has no capture yet (web: `capture:web`; mobile: `capture:mobile`, see
`docs/launch-readiness.md`).

## Web frames (18)
- [ ] `chat-against-a-recipe--web-1-entry-on-recipe` — _not captured_ — approved by ___ on ___
- [ ] `chat-against-a-recipe--web-2-chat-panel-open` — _not captured_ — approved by ___ on ___
- [ ] `marketing-auth--web-login` — _0.26% mismatch_ — approved by ___ on ___
- [ ] `home--web-home` — _4.73% mismatch_ — approved by ___ on ___
- [ ] `result-after-generation--web-result` — _4.05% mismatch_ — approved by ___ on ___
- [ ] `cook-tab-library--web-cook-empty` — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-at-the-stove--web-cook-in-session` — _not captured_ — approved by ___ on ___
- [ ] `generating-state--web-1-thinking` — _1.95% mismatch_ — approved by ___ on ___
- [ ] `generating-state--web-2-drafting` — _1.74% mismatch_ — approved by ___ on ___
- [ ] `inventory-recipe-detail--web-inventory-full-pantry` — _not captured_ — approved by ___ on ___
- [ ] `inventory-recipe-detail--web-recipe-detail` — _not captured_ — approved by ___ on ___
- [ ] `ingredient-form-account--web-ingredient-form` — _not captured_ — approved by ___ on ___
- [ ] `ingredient-form-account--web-user-account` — _not captured_ — approved by ___ on ___
- [ ] `paywall-variation-a--web-paywall-onboarding` — _not captured_ — approved by ___ on ___
- [ ] `paywall-variation-b--web-paywall-plan-compare` — _not captured_ — approved by ___ on ___
- [ ] `contextual-paywalls--web-limit-hit-modal` — _not captured_ — approved by ___ on ___
- [ ] `free-trial-lifecycle--web-trial-ending-page` — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--web-settings-subscription-pro-active` — _not captured_ — approved by ___ on ___

## Mobile frames (37)

Capture: `pnpm --filter @pantry/design-fidelity capture:mobile` (booted iOS
simulator + running Expo app — see `docs/launch-readiness.md`). Each captured
screenshot is auto-resized to its reference width (`sips`) so the sweep diff is
meaningful (the ~60% mismatches above were a pure scale artifact, now fixed by
`normalizeForDiff`).

Tags: **`[deep-link]`** = reachable now via `pantrycopilot://…` (11 frames,
mapped in `capture-app-mobile.ts` `ROUTES`); **`[needs dev deep-link]`** =
mid-flow / state-dependent view with no addressable route — deferred until the
mobile app exposes a dev-only deep link (out of scope for this capture plan;
it's an app change). The mismatch %s below predate the normalization fix.

- [ ] `pantry-consume-flow--1-result-pantry-shown-inline` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `pantry-consume-flow--2-end-of-cook-the-ask` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `pantry-consume-flow--3-consume-sheet` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `chat-against-a-recipe--mobile-1-entry-on-recipe` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `chat-against-a-recipe--mobile-2-chat-sheet-open` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `marketing-auth--mobile-login` _[deep-link]_ — _65.58% mismatch_ — approved by ___ on ___
- [ ] `home--mobile-home` _[deep-link]_ — _61.62% mismatch_ — approved by ___ on ___
- [ ] `home--mobile-home-selecting` _[needs dev deep-link]_ — _61.88% mismatch_ — approved by ___ on ___
- [ ] `home--mobile-home-browse-pantry` _[needs dev deep-link]_ — _67.77% mismatch_ — approved by ___ on ___
- [ ] `result-after-generation--mobile-result` _[deep-link]_ — _61.43% mismatch_ — approved by ___ on ___
- [ ] `cook-tab-library--mobile-cook-default` _[deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-library--mobile-cook-with-resume` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-library--mobile-cook-new-tapped` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-at-the-stove--mobile-cook-in-session` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `generating-state--mobile-1-thinking` _[needs dev deep-link]_ — _60.81% mismatch_ — approved by ___ on ___
- [ ] `generating-state--mobile-2-drafting` _[needs dev deep-link]_ — _61.10% mismatch_ — approved by ___ on ___
- [ ] `mobile-pantry-recipe--pantry-tap-to-cook` _[deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-pantry-recipe--recipe-detail` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--1-viewfinder` _[deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--2-detecting` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--3-review-items` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--4-added-to-pantry` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-add-ingredient-edit-ingredient--add-ingredient` _[deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-add-ingredient-edit-ingredient--edit-ingredient` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--category-picker` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--location-picker` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--best-by-picker` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-account--account` _[deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `paywall-variation-a--mobile-paywall` _[deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `paywall-variation-b--mobile-paywall` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `contextual-paywalls--mobile-limit-hit-sheet` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `free-trial-lifecycle--mobile-pre-trial-offer` _[deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `free-trial-lifecycle--mobile-trial-ending` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-free-user` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-trial` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-pro-active` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-manage-subscription` _[deep-link]_ — _not captured_ — approved by ___ on ___
