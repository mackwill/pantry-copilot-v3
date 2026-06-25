# M8 — Monetization: fidelity checklist

The 13 board reference frames (§11–§15) drive the gate. All automated gates —
contracts + `@pantry/api-client` + API (subscription service / quota limits /
idempotent RC webhook / entitlement-gated generation + scan / top-up ledger) +
web component/hook + mobile hook/component tests, lint, typecheck,
`pnpm -r build` — are **green** (api 77, web 121, mobile 136). The web Playwright
limit-hit→paywall→unlock spec (`e2e/web/specs/paywall.spec.ts`) is **written and
typechecks clean; local stack verification pending** (the harness boots its own
api/ai/web on 4000/4001/3000, which were occupied by the running podman-forwarded
dev stack in this session — same local-verification-pending posture as M5/M6/M7).
Screenshot capture + visual approval is **pending review** (web needs the full
stack; mobile needs the pinned simulator + frozen clock for the trial-countdown
frames), consistent with the M2–M7 fidelity-review-pending precedent.

## The 13 frames to approve

| #  | Frame (board) | Capture surface | Status |
| -- | ------------- | --------------- | ------ |
| 1  | Web · Paywall editorial (`WebPaywallA`)        | `/upgrade` (full-bleed editorial paywall) | pending review |
| 2  | Mobile · Paywall A (`MobilePaywallA`)          | `/(billing)/paywall` (editorial paywall) | pending review |
| 3  | Web · Paywall compare (`WebPaywallB`)          | `/upgrade?variant=compare` (plan ledger) | pending review |
| 4  | Mobile · Paywall B (`MobilePaywallB`)          | `/(billing)/paywall?variant=compare` (plan ledger) | pending review |
| 5  | Web · Limit-hit modal (`WebLimitHit`)          | `/cook/generate` over a blocked generation (LimitHitModal) | pending review |
| 6  | Mobile · Limit-hit sheet (`MobileLimitHit`)    | cook generate → blocked → LimitHitSheet (78% sheet) | pending review |
| 7  | Mobile · Pre-trial offer (`MobileTrialOffer`)  | `/(billing)/trial?variant=offer` (TrialOffer card) | pending review |
| 8  | Mobile · Trial-ending (`MobileTrialEnding`)    | `/(billing)/trial` (TrialEnding · "2 days left") | pending review |
| 9  | Web · Trial-ending page (`WebTrialEnding`)     | `/trial` (in-shell trial-ending page) | pending review |
| 10 | Web · Settings → Subscription (Pro active)     | `/account` (SubscriptionRows · Pro state) | pending review |
| 11 | Mobile · Settings (Free)                       | `/me` (SubscriptionSection `state="free"`) | pending review |
| 12 | Mobile · Settings (Trial)                      | `/me` (SubscriptionSection `state="trial"`) | pending review |
| 13 | Mobile · Settings (Pro) + Manage               | `/me` (`state="pro"`) → `/(billing)/manage` (ManageSubscription) | pending review |

## Logged divergences (see `docs/decisions.md` — M8 entries 2026-06-19 through 2026-06-25)

- **Weekly free quota (reset Sunday 00:00 UTC), not v2's monthly.** Board-faithful;
  the limit copy reads "3 of 3 generations this week · resets Sunday". Recipe quota
  counts only `recipes.source = 'ai'` rows; scan quota counts every `image_scans`
  row (all are AI inferences, including failed attempts).
- **Tier enum `free/basic/pro` with `isPro` derived**, chosen over v2's binary flag.
  The three settings frames (11 free / 12 trial / 13 pro) derive their display state
  from `isPro` + RevenueCat `period_type === 'trial'` (there is no `trial` SubState).
- **RevenueCat behind env guards.** Web Billing is gated by
  `VITE_REVENUECAT_WEB_BILLING_KEY`; mobile reaches the native SDK only via a lazy
  guarded import and no-ops in Expo Go — **real purchases require a dev build / EAS**
  with RC keys set. The e2e specs drive the screens, not a live charge.
- **No web Modal primitive — LimitHitModal composed in-feature** (fixed-position scrim
  + `role="dialog" aria-modal`). The faux blurred cook-screen behind the board modal is
  not reproduced; the real `GenerateScreen` is already mounted behind the scrim.
- **Brand gradients render as solid bars on mobile** (weirdness anchor → `accentStrong`;
  pro status / manage hero → solid `accent`): RN ships no gradient and the project pins
  no gradient dependency. Follow-up: `expo-linear-gradient` at a milestone boundary.
- **`FoodImageSlot` is a flat sunk placeholder** (web CSS stripe / native `bgSunk` tile)
  until real food photography lands — matches the board's placeholder.
- **Web entry/route mapping.** `/upgrade` switches `PaywallEditorial` ↔ `PaywallCompare`
  on `?variant=compare`; `/trial` is the in-shell trial-ending page (sidebar, no topbar).
  Mobile `(billing)/paywall` and `(billing)/trial` mirror this with `?variant`.
- **Manage actions route, not call.** Cancel / change-plan deep-link to the compare
  paywall (cancellation is App-Store/RC-managed; no in-app cancel API); only Restore
  calls a real SDK path. Trial countdown / billing dates are static board copy — no
  live trial clock wired (see frozen-clock note below).
- **`shield-check` → `Lock`** on web (icon not in the curated map); follow-up to add
  `ShieldCheck` at a milestone boundary.

## Capture instructions

**Web (frames 1, 3, 5, 9, 10):** run api (4000) + ai (4001, `DEFAULT_AI_PROVIDER=mock`)
+ web (3000). Capture at 1280×861@2x via the `tools/design-fidelity` web flow; compare
with `src/compare.ts` (pixelmatch, threshold 0.1).
- Frame 1: `/upgrade`. Frame 3: `/upgrade?variant=compare`.
- Frame 5: sign up, seed the user to the free weekly recipe cap (3 `source='ai'`
  recipes this week — or generate 3), submit a 4th generation on `/cook`; capture the
  `LimitHitModal` over `/cook/generate`.
- Frame 9: `/trial` (trial-ending page; figures are static board copy).
- Frame 10: `/account` with the user in the Pro state — grant Pro by inserting a
  `user_subscriptions` row (`tier='pro'`, `is_pro=true`, `sub_state='active'`) before
  loading the page (the SubscriptionRows derive Pro vs Free from `subscription.isPro`).

**Mobile (frames 2, 4, 6, 7, 8, 11, 12, 13):** pinned simulator (iPhone 16 Pro /
iOS 18.5, Expo Go) with status-bar override (per M1–M7). `xcrun simctl io screenshot`
each; the gate is human side-by-side (390px board frame vs device width — pixelmatch %
is not the gate).
- Frame 2: `/(billing)/paywall`. Frame 4: `/(billing)/paywall?variant=compare`.
- Frame 6: at the free weekly cap, submit a generation from Home → the `LimitHitSheet`
  opens (78%).
- Frame 7: `/(billing)/trial?variant=offer` (TrialOffer). Frame 8: `/(billing)/trial`
  (TrialEnding).
- Frames 8 & 12 need a **frozen clock** so the trial reads "2 days left" / "day 5 of 7":
  trial **started Apr 26**, **today = day 5 of 7**, **billing May 3** (per the plan).
  Freeze the device clock to that day-5 instant before capturing.
- Frames 11/12/13: `/me` with the subscription in `free` / `trial` / `pro` state
  respectively (state derived from `isPro` + `period_type`); from frame 13 tap the
  manage CTA → `/(billing)/manage` (ManageSubscription).
