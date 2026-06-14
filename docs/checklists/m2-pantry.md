# M2 — Pantry core: fidelity checklist

The 10 M2 board reference frames are captured and committed under
`tools/design-fidelity/references/` (regenerated headlessly via
`pnpm -C tools/design-fidelity capture:references`; the M2 frames are
byte-stable). Functional rendering of the web frames is proven end-to-end by
`e2e/web/specs/pantry.spec.ts` (add → edit → delete, all assertions green).

**Visual side-by-side approval is PENDING interactive review** — the app-side
capture (`capture:web` against seeded dev servers for web; `xcrun simctl`
screenshots on the pinned simulator for mobile) and the human side-by-side gate
require a display/simulator and seeded pantry data, and have not been run in the
automation that produced this milestone. Approve each row below when the capture
is taken and compared.

| # | Frame | Reference | Platform | Status |
| - | ----- | --------- | -------- | ------ |
| 1 | Inventory (full pantry) §05 | `inventory-recipe-detail--web-inventory-full-pantry.png` | web | references captured · visual approval pending |
| 2 | Ingredient form §06 | `ingredient-form-account--web-ingredient-form.png` | web | references captured · visual approval pending |
| 3 | User account §06 | `ingredient-form-account--web-user-account.png` | web | references captured · visual approval pending |
| 4 | Pantry tap-to-cook §07 | `mobile-pantry-recipe--pantry-tap-to-cook.png` | mobile | references captured · visual approval pending |
| 5 | Add ingredient §09 | `mobile-add-ingredient-edit-ingredient--add-ingredient.png` | mobile | references captured · visual approval pending |
| 6 | Edit ingredient §09 | `mobile-add-ingredient-edit-ingredient--edit-ingredient.png` | mobile | references captured · visual approval pending |
| 7 | Category picker §09.5 | `mobile-bottom-sheets--category-picker.png` | mobile | references captured · visual approval pending |
| 8 | Location picker §09.5 | `mobile-bottom-sheets--location-picker.png` | mobile | references captured · visual approval pending |
| 9 | Best-by picker §09.5 | `mobile-bottom-sheets--best-by-picker.png` | mobile | references captured · visual approval pending |
| 10 | Account §10 | `mobile-account--account.png` | mobile | references captured · visual approval pending |

## Functional verification (done, green)

- **Unit/contract/integration:** `pnpm test` — contracts (11), utils (incl.
  freshness + monthGrid + addDays), api pantry integration (create/list/update/
  delete/ownership, 26 total), web component+hook (40), mobile hook+sheet (35),
  design-system (109). All green.
- **Types & lint:** `pnpm typecheck` (0 errors, all workspaces) and `pnpm lint`
  (`--max-warnings 0`, no `eslint-disable`/`any`/`@ts-expect-error`).
- **Build:** `pnpm -r build` succeeds.
- **DB:** `0001_faithful_sumo` migration applies cleanly on a fresh DB.
- **Web e2e:** `pnpm --filter @pantry/e2e-web e2e` — 3/3 green (M1 auth + the M2
  pantry add→edit→delete flow). This is the functional proof for web frames 1–3.

## Maestro (mobile)

`e2e/mobile/pantry.yaml` — launch → Pantry tab → tap a row → assert the Cook
tray ("Cook with 1") appears. Local/Expo-Go verification pending (CI execution
deferred, per the M1 precedent in `m1-auth.md`). The Cook button is a stub until
M4.

## Known fidelity notes (see decisions.md, 2026-06-14)

- Mobile add/edit ingredient name renders in Inter ~14px (native `Input` has no
  display-font override), notes is single-line, and the edit freshness bar is a
  single accent fill rather than the board's gradient — deferred polish, flagged
  for the visual review.
- Mobile pantry header carries an extra `Plus` add entry (board §07 shows only
  search + sliders) — a sanctioned, usable entry point.
