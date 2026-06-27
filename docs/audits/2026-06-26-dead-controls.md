# Dead controls inventory — 2026-06-26 (M10)

Source of truth for the M10 dead-controls remediation. A control is "dead" if it is
interactive (or looks interactive) but produces no observable effect. See
`docs/superpowers/specs/2026-06-26-m10-dead-controls-slider-design.md` for the full
definition and the wire/remove recommendation rule.

## Summary

- Web: 18 dead controls (3 wire / 0 remove / 15 flag)
- Mobile: <N> dead controls (<wire> wire / <remove> remove / <flag> flag)
- Design-system: <N> dead controls (<wire> wire / <remove> remove / <flag> flag)

## Needs your decision (flag rows)

- `HeroPrompt.tsx:54` — Mic button — board shows the button (home-cook-v2.jsx:67) but specifies no action; options: (a) trigger browser `MediaRecorder` voice-to-text and fill the textarea, (b) keep as a non-interactive decorative affordance and remove the `<button>` wrapper
- `OneRecipeCard.tsx:91` — Share button in result card — board shows "Share" in §02 (home-cook-v2.jsx:738) but no share UX is specified; options: (a) Web Share API / `navigator.share`, (b) copy-link toast, (c) defer to a future milestone and remove the button
- `CollapsedReasoning.tsx:21` — "show reasoning ↓" span — board shows it in §02/§04 (home-cook-v2.jsx:816) with cursor:pointer but no expanded-state screen exists; options: (a) inline toggle that shows the `ThinkingPanel` content collapsed/expanded, (b) navigate to a dedicated reasoning view
- `InventoryScreen.tsx:22` — Import button — board shows it in §05 WebInventory topbar (web-screens-b.jsx:23) but no import flow screen is present anywhere in the board; options: (a) CSV/photo import modal, (b) route to a scan screen, (c) remove
- `InventoryScreen.tsx:25` — Scan button — board shows it in §05 WebInventory topbar (web-screens-b.jsx:24); the only scan flow in the board is §08 mobile-only; options: (a) open device camera for web, (b) show "mobile only" message, (c) remove from web topbar
- `RecipeDetailScreen.tsx:69` — Share button on recipe detail — board shows it in §05 WebRecipeDetail (web-screens-b.jsx:106); no share UX specified; options: (a) Web Share API, (b) copy-link toast
- `RecipeDetailScreen.tsx:72` — Print button on recipe detail — board shows it in §05 WebRecipeDetail (web-screens-b.jsx:107); options: (a) `window.print()` with a print stylesheet, (b) generate PDF, (c) remove
- `LoginForm.tsx:66` — "Forgot password" span — board shows it in §00 WebLogin (web-screens-a.jsx:39) with cursor:pointer; no forgot-password screen exists in the board or codebase; options: (a) wire to a new `/forgot-password` route, (b) remove until the flow is built
- `ProfileCard.tsx:34` — "Change photo" button — board shows it in §06 WebAccount (web-screens-b.jsx:359); no photo-upload flow is shown; options: (a) open a file-picker and upload to storage, (b) remove until avatar upload is built
- `PreferencesCard.tsx:10` — "Edit" span — board shows it in §06 WebAccount (web-screens-b.jsx:373) with cursor:pointer; no edit preferences screen exists; options: (a) route to a `/settings/preferences` page, (b) open an inline edit mode, (c) remove
- `AccountSidebar.tsx:33` — "Pantry preferences" nav button — board shows in §06 sidebar (web-screens-b.jsx:330); destination page not in board or codebase; options: (a) wire to future `/settings/pantry-preferences` route, (b) disable visually until built
- `AccountSidebar.tsx:33` — "Diet & allergies" nav button — board shows in §06 sidebar; destination not built; options: (a) wire to `/settings/diet`, (b) disable visually
- `AccountSidebar.tsx:33` — "Notifications" nav button — board shows in §06 sidebar; destination not built; options: (a) wire to `/settings/notifications`, (b) disable visually
- `AccountSidebar.tsx:33` — "Connections" nav button — board shows in §06 sidebar; destination not built; options: (a) wire to `/settings/connections`, (b) disable visually
- `AccountSidebar.tsx:33` — "Billing" nav button — board shows in §06 sidebar; destination not built; options: (a) wire to existing `/upgrade` route, (b) wire to `/settings/subscription` once built

## Web (`apps/web`)

| File:line | Control | Current behavior | Board says | Recommendation | Notes |
| --------- | ------- | ---------------- | ---------- | -------------- | ----- |
| `HomeContextCards.tsx:34` | "Pantry →" accent span | `cursor:pointer` (.ctxLink), no onClick — click does nothing | §01 home-cook-v2.jsx:171 shows span with cursor:pointer linking to Pantry | **wire** | Navigate to `/pantry` |
| `HomeContextCards.tsx:58` | "Recipes →" accent span | `cursor:pointer` (.ctxLink), no onClick — click does nothing | §01 home-cook-v2.jsx:205 shows span with cursor:pointer linking to Recipes | **wire** | Navigate to `/recipes` |
| `GenerateScreen.tsx:110` | "Start cooking" primary button (inside `OneRecipeCard`) | `onStartCooking` not passed in result render; `OneRecipeCard.tsx:84` spreads an empty object when prop is `undefined` — button renders but click does nothing | §02 home-cook-v2.jsx:734 shows "Start cooking" button that starts a cook session | **wire** | Call `api.cook.start.mutate({ recipeId })` then navigate to `/cook/session`; `recipeId` is `gen.recipeId` (non-null at `status === 'result'`) |
| `HeroPrompt.tsx:54` | Mic `<button>` | `<button>` element with no onClick; `.heroMic` CSS has cursor:pointer; click does nothing | §01 home-cook-v2.jsx:67–72 shows mic button styled with cursor:pointer in the hero prompt footer | **flag** | Behavior not specified; see "Needs your decision" |
| `OneRecipeCard.tsx:91` | Share `<Button>` in result card action row | `kind="ghost"` Button with `Share2` icon; no onClick prop; click does nothing | §02 home-cook-v2.jsx:738 shows Share button alongside Start cooking and Save in the result card | **flag** | Share UX unspecified; see "Needs your decision" |
| `CollapsedReasoning.tsx:21` | "show reasoning" span | `<span className={styles['collapsedShow']}>` with cursor:pointer CSS; no onClick; click does nothing | §02/§04 home-cook-v2.jsx:816 shows "show reasoning ↓" with cursor:pointer in the collapsed bar | **flag** | Expand behavior not shown in board; see "Needs your decision" |
| `InventoryScreen.tsx:22` | Import `<Button>` in Topbar | `kind="secondary"` Button with Upload icon; no onClick; click does nothing | §05 web-screens-b.jsx:23 shows Import button in the WebInventory topbar | **flag** | No import flow in board; see "Needs your decision" |
| `InventoryScreen.tsx:25` | Scan `<Button>` in Topbar | `kind="secondary"` Button with ScanLine icon; no onClick; click does nothing | §05 web-screens-b.jsx:24 shows Scan button in the WebInventory topbar | **flag** | Only mobile scan flow defined; see "Needs your decision" |
| `RecipeDetailScreen.tsx:69` | Share `<Button>` on recipe detail | `kind="secondary" size="sm"` Button with Share2 icon; no onClick; click does nothing | §✦ web-screens-b.jsx:106 (WebRecipeDetail) shows Share button in the top action row | **flag** | Share UX unspecified; see "Needs your decision" |
| `RecipeDetailScreen.tsx:72` | Print `<Button>` on recipe detail | `kind="secondary" size="sm"` Button with Printer icon; no onClick; click does nothing | §05 web-screens-b.jsx:107 (WebRecipeDetail) shows Print button in the top action row | **flag** | Print UX unspecified; see "Needs your decision" |
| `LoginForm.tsx:66` | "Forgot password" `<span>` | `<span className={styles['forgot']}>` with cursor:pointer CSS; no onClick; click does nothing | §00 web-screens-a.jsx:39 shows "Forgot password" with cursor:pointer | **flag** | Forgot-password flow not built; see "Needs your decision" |
| `ProfileCard.tsx:34` | "Change photo" `<Button>` | `kind="secondary" size="sm"` Button; no onClick; click does nothing | §06 web-screens-b.jsx:359 shows "Change photo" button in the profile card header | **flag** | File-upload flow not specified; see "Needs your decision" |
| `PreferencesCard.tsx:10` | "Edit" `<span>` | `<span className={styles['editLink']}>` with cursor:pointer CSS; no onClick; click does nothing | §06 web-screens-b.jsx:373 shows "Edit" span with cursor:pointer on cooking preferences | **flag** | Edit preferences destination not defined; see "Needs your decision" |
| `AccountSidebar.tsx:33` | "Pantry preferences" nav `<button>` | `<button>` with cursor:pointer CSS (.navRow); no onClick; click does nothing | §06 web-screens-b.jsx:330 shows all nav items including this one with cursor:pointer | **flag** | Route not built; see "Needs your decision" |
| `AccountSidebar.tsx:33` | "Diet & allergies" nav `<button>` | `<button>` with cursor:pointer CSS (.navRow); no onClick; click does nothing | §06 web-screens-b.jsx:330 shows all nav items with cursor:pointer | **flag** | Route not built; see "Needs your decision" |
| `AccountSidebar.tsx:33` | "Notifications" nav `<button>` | `<button>` with cursor:pointer CSS (.navRow); no onClick; click does nothing | §06 web-screens-b.jsx:330 shows all nav items with cursor:pointer | **flag** | Route not built; see "Needs your decision" |
| `AccountSidebar.tsx:33` | "Connections" nav `<button>` | `<button>` with cursor:pointer CSS (.navRow); no onClick; click does nothing | §06 web-screens-b.jsx:330 shows all nav items with cursor:pointer | **flag** | Route not built; see "Needs your decision" |
| `AccountSidebar.tsx:33` | "Billing" nav `<button>` | `<button>` with cursor:pointer CSS (.navRow); no onClick; click does nothing | §06 web-screens-b.jsx:330 shows all nav items with cursor:pointer | **flag** | `/upgrade` route exists; could wire cheaply but subscription settings page is not built; see "Needs your decision" |

## Mobile (`apps/mobile`)

| File:line | Control | Current behavior | Board says | Recommendation | Notes |
| --------- | ------- | ---------------- | ---------- | -------------- | ----- |

## Design system (`packages/design-system`)

| File:line | Control | Current behavior | Board says | Recommendation | Notes |
| --------- | ------- | ---------------- | ---------- | -------------- | ----- |
