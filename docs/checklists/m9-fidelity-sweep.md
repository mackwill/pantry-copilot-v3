# M9 — Final full-board fidelity sweep

Run: `pnpm --filter @pantry/design-fidelity sweep` → open `tools/design-fidelity/output/report.html`.
Tripwire: `SWEEP_TRIPWIRE_PCT` (default 2%) on already-approved frames.

Approval = human review of reference│actual│diff (layout/spacing/type/color, not pixel-identity).
Mismatch %s below are pre-filled from the latest sweep; `not captured` means the
frame has no capture yet (web: `capture:web`; mobile: `capture:mobile`, see
`docs/launch-readiness.md`).

## Web frames (18)

All 18 captured (sweep 0/18 missing). %s are the latest measured mismatch
(`pnpm --filter @pantry/design-fidelity capture:web:all && … sweep`). Residual %s
are dominated by known app-vs-board differences (mock recipe bodies, simpler
side-nav, fresh signup identity).

**Sign-off (2026-06-26):** all 18 web frames **approved** by the maintainer.
The 17 cosmetic frames are intended-behavior accepts; `subscription-in-settings--web-…pro-active`
is accepted as the inline-on-`/settings` composition for v3 (the dedicated
Subscription page + usage meter is a post-launch enhancement). Rationale logged
in `docs/decisions.md` → 2026-06-26 fidelity-review entry. **Web fidelity is
complete.**

- [x] `chat-against-a-recipe--web-1-entry-on-recipe` — _5.52% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `chat-against-a-recipe--web-2-chat-panel-open` — _4.74% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `marketing-auth--web-login` — _0.26% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `home--web-home` — _4.75% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `result-after-generation--web-result` — _4.07% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `cook-tab-library--web-cook-empty` — _2.38% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `cook-tab-at-the-stove--web-cook-in-session` — _2.55% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept; Read-aloud/Pause controls deferred — see decisions 2026-06-26)
- [x] `generating-state--web-1-thinking` — _1.85% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `generating-state--web-2-drafting` — _1.78% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `inventory-recipe-detail--web-inventory-full-pantry` — _2.67% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept; granular location labels + danger-first order are intended — see decisions 2026-06-26)
- [x] `inventory-recipe-detail--web-recipe-detail` — _5.83% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept; mock recipe body)
- [x] `ingredient-form-account--web-ingredient-form` — _1.43% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `ingredient-form-account--web-user-account` — _2.09% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `paywall-variation-a--web-paywall-onboarding` — _1.06% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `paywall-variation-b--web-paywall-plan-compare` — _2.52% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `contextual-paywalls--web-limit-hit-modal` — _3.09% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `free-trial-lifecycle--web-trial-ending-page` — _2.02% mismatch_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept)
- [x] `subscription-in-settings--web-settings-subscription-pro-active` — _17.55% mismatch · ⚠ DIVERGENCE: app composes the Pro card inline on /settings (no dedicated Subscription page + usage meter)_ — approved by W. Mindenhall on 2026-06-26 (accept inline for v3; dedicated page + usage meter is a post-launch enhancement — see decisions 2026-06-26)

## Mobile frames (37)

Capture: `pnpm --filter @pantry/design-fidelity capture:mobile` (booted iOS
simulator + running Expo app — see `docs/launch-readiness.md`). Each captured
screenshot is auto-resized to its reference width (`sips`) so the sweep diff is
meaningful (the ~60% mismatches above were a pure scale artifact, now fixed by
`normalizeForDiff`).

Tags: **`[deep-link]`** = a statically-addressable top-level screen;
**`[needs dev deep-link]`** = mid-flow / state-dependent view with no
addressable route.

**Capture method (important):** `simctl openurl pantrycopilot://…` does **not**
work against the installed dev build — iOS shows an unavoidable "Open in app?"
prompt and the expo-dev-client intercepts the scheme (grey screen). The working
method is **Maestro UI navigation** (`tools/design-fidelity/maestro/fidelity-capture.yaml`),
after `e2e/mobile/sign-in.yaml` establishes a session. **All 8 reachable
`[deep-link]` frames captured + approved** (✓ below): login, home, cook, account,
pantry, scan viewfinder, add-ingredient, and result (after the generation bug
fix). 3 `[deep-link]` frames remain blocked pending app-side work (paywall /
trial / manage — no in-app entry point). Each captured shot is sips-resized to
its reference width; `normalizeForDiff` handles residual scale. % = latest measured.

- [ ] `pantry-consume-flow--1-result-pantry-shown-inline` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `pantry-consume-flow--2-end-of-cook-the-ask` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `pantry-consume-flow--3-consume-sheet` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `chat-against-a-recipe--mobile-1-entry-on-recipe` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `chat-against-a-recipe--mobile-2-chat-sheet-open` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [x] `marketing-auth--mobile-login` _[deep-link]_ — _12.74% mismatch · ✓ captured_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept · mobile geometry, side-by-side)
- [x] `home--mobile-home` _[deep-link]_ — _13.79% mismatch · ✓ captured (Maestro)_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept · mobile geometry, side-by-side)
- [ ] `home--mobile-home-selecting` _[needs dev deep-link]_ — _61.88% mismatch_ — approved by ___ on ___
- [ ] `home--mobile-home-browse-pantry` _[needs dev deep-link]_ — _67.77% mismatch_ — approved by ___ on ___
- [x] `result-after-generation--mobile-result` _[deep-link]_ — _13.94% mismatch · ✓ captured (Maestro, after the generation bug fix). The original "hit a snag (stream 0.0s)" failure had two Hermes causes, both fixed (see decisions 2026-06-26): tRPC v11 `httpSubscriptionLink` disposal needs `Symbol.dispose`/`asyncDispose`/`SuppressedError` (polyfilled at `apps/mobile/index.js`), masking the real trigger — `newRequestId()` → missing `crypto.randomUUID()` global (now a non-crypto UUID fallback in `@pantry/api-client`)._ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept · mobile geometry, side-by-side)
- [x] `cook-tab-library--mobile-cook-default` _[deep-link]_ — _12.27% mismatch · ✓ captured (Maestro)_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept · mobile geometry, side-by-side)
- [ ] `cook-tab-library--mobile-cook-with-resume` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-library--mobile-cook-new-tapped` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `cook-tab-at-the-stove--mobile-cook-in-session` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `generating-state--mobile-1-thinking` _[needs dev deep-link]_ — _60.81% mismatch_ — approved by ___ on ___
- [ ] `generating-state--mobile-2-drafting` _[needs dev deep-link]_ — _61.10% mismatch_ — approved by ___ on ___
- [x] `mobile-pantry-recipe--pantry-tap-to-cook` _[deep-link]_ — _17.78% mismatch · ✓ captured (Maestro) · empty pantry (maestro user has no items)_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept · layout matches; recapture with a seeded pantry if a populated frame is wanted)
- [ ] `mobile-pantry-recipe--recipe-detail` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [x] `mobile-camera-scan-flow--1-viewfinder` _[deep-link]_ — _24.88% mismatch · ✓ captured (Maestro)_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept · mobile geometry, side-by-side)
- [ ] `mobile-camera-scan-flow--2-detecting` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--3-review-items` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-camera-scan-flow--4-added-to-pantry` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [x] `mobile-add-ingredient-edit-ingredient--add-ingredient` _[deep-link]_ — _17.24% mismatch · ✓ captured (Maestro)_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept · mobile geometry, side-by-side)
- [ ] `mobile-add-ingredient-edit-ingredient--edit-ingredient` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--category-picker` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--location-picker` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `mobile-bottom-sheets--best-by-picker` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [x] `mobile-account--account` _[deep-link]_ — _11.07% mismatch · ✓ captured (Maestro)_ — approved by W. Mindenhall on 2026-06-26 (cosmetic accept · mobile geometry, side-by-side)
- [ ] `paywall-variation-a--mobile-paywall` _[deep-link]_ — _not captured · blocked: no in-app entry point + deep links blocked on dev build_ — approved by ___ on ___
- [ ] `paywall-variation-b--mobile-paywall` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `contextual-paywalls--mobile-limit-hit-sheet` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `free-trial-lifecycle--mobile-pre-trial-offer` _[deep-link]_ — _not captured · blocked: no in-app entry point + deep links blocked on dev build_ — approved by ___ on ___
- [ ] `free-trial-lifecycle--mobile-trial-ending` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-free-user` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-trial` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-settings-pro-active` _[needs dev deep-link]_ — _not captured_ — approved by ___ on ___
- [ ] `subscription-in-settings--mobile-manage-subscription` _[deep-link]_ — _not captured · blocked: no in-app entry point + deep links blocked on dev build_ — approved by ___ on ___
