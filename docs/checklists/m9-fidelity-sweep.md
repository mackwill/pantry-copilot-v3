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
- [ ] `pantry-consume-flow--1-result-pantry-shown-inline` — _not captured_ — approved by ___ on ___
- [ ] `pantry-consume-flow--2-end-of-cook-the-ask` — _not captured_ — approved by ___ on ___
- [ ] `pantry-consume-flow--3-consume-sheet` — _not captured_ — approved by ___ on ___
- [ ] `chat-against-a-recipe--mobile-1-entry-on-recipe` — _not captured_ — approved by ___ on ___
- [ ] `chat-against-a-recipe--mobile-2-chat-sheet-open` — _not captured_ — approved by ___ on ___
- [ ] `marketing-auth--mobile-login` — _65.58% mismatch_ — approved by ___ on ___
- [ ] `home--mobile-home` — _61.62% mismatch_ — approved by ___ on ___
- [ ] `home--mobile-home-selecting` — _61.88% mismatch_ — approved by ___ on ___
- [ ] `home--mobile-home-browse-pantry` — _67.77% mismatch_ — approved by ___ on ___
- [ ] `result-after-generation--mobile-result` — _61.43% mismatch_ — approved by ___ on ___
- [ ] `cook-tab-library--mobile-cook-default` — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-library--mobile-cook-with-resume` — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-library--mobile-cook-new-tapped` — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-at-the-stove--mobile-cook-in-session` — _not captured_ — approved by ___ on ___
- [ ] `generating-state--mobile-1-thinking` — _60.81% mismatch_ — approved by ___ on ___
- [ ] `generating-state--mobile-2-drafting` — _61.10% mismatch_ — approved by ___ on ___
- [ ] `mobile-pantry-recipe--pantry-tap-to-cook` — _not captured_ — approved by ___ on ___
- [ ] `mobile-pantry-recipe--recipe-detail` — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--1-viewfinder` — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--2-detecting` — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--3-review-items` — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--4-added-to-pantry` — _not captured_ — approved by ___ on ___
- [ ] `mobile-add-ingredient-edit-ingredient--add-ingredient` — _not captured_ — approved by ___ on ___
- [ ] `mobile-add-ingredient-edit-ingredient--edit-ingredient` — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--category-picker` — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--location-picker` — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--best-by-picker` — _not captured_ — approved by ___ on ___
- [ ] `mobile-account--account` — _not captured_ — approved by ___ on ___
- [ ] `paywall-variation-a--mobile-paywall` — _not captured_ — approved by ___ on ___
- [ ] `paywall-variation-b--mobile-paywall` — _not captured_ — approved by ___ on ___
- [ ] `contextual-paywalls--mobile-limit-hit-sheet` — _not captured_ — approved by ___ on ___
- [ ] `free-trial-lifecycle--mobile-pre-trial-offer` — _not captured_ — approved by ___ on ___
- [ ] `free-trial-lifecycle--mobile-trial-ending` — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-free-user` — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-trial` — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-pro-active` — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-manage-subscription` — _not captured_ — approved by ___ on ___
