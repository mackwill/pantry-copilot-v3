# M4 — Home + generation + result: fidelity checklist

The 10 M4 board reference frames (§01 Home, §04 generating, §02 Result) are
captured and committed under `tools/design-fidelity/references/`. The **four web
frames** were driven through the **running app** against the mock event tape and
compared side-by-side (pixelmatch + visual review) — see notes below. The **six
mobile frames** depend on Slice G (mobile UI), which is **not yet built**; their
visual approval is deferred to that slice (references already captured).

## Web frames (§01/§04/§02) — captured + compared

Capture: `tools/design-fidelity/src/capture-m4-web.ts` drives signup → seed pantry
→ Home → prompt → Thinking → Drafting → Result at 1280×861@2x against the AI
service running the mock tape (`MOCK_STREAM_DELAY_MS≈1000` to freeze the streaming
beats). Compare: `src/compare.ts` (pixelmatch, threshold 0.1). Mismatch % reflects
**text/content differences** (mock recipe vs the board's "Milk-braised carrots"),
not layout drift.

| # | Frame | Reference | Mismatch | Status |
| - | ----- | --------- | -------- | ------ |
| 1 | Web · Home §01 | `home--web-home.png` | 4.73% | **approved** — hero (eyebrow, 32px display prompt, gradient weirdness + "curious", suggestion pills, "Cook this"), populated "Want using soon" card, "Try:" hint all match. Divergences below. |
| 2 | Web · 1. Thinking §04 | `generating-state--web-1-thinking.png` | 1.95% | **approved** — crumb row, "Your ask", "Thinking · N tools" header, interleaved italic prose + mono tool rows (› name → result), Stop + footnote all match. Content is the mock tape; elapsed reads higher because the capture uses an artificial 1 s/frame delay. |
| 3 | Web · 2. Drafting §04 | `generating-state--web-2-drafting.png` | 1.74% | **approved against the single-recipe variant** — collapsed reasoning bar + streaming recipe card (THE PICK · drafting, title + caret, ingredients streaming, "waiting for ingredients…" method) match. **Deliberate divergence:** no "Recipe 1 of 3" eyebrow / queued cards (one recipe per request — see decisions.md). |
| 4 | Web · Result §02 | `result-after-generation--web-result.png` | 4.05% | **approved** — collapsed reasoning + OneRecipeCard (THE PICK + pills "uses N expiring"/"N ingredients"/"N min", title, summary, two-column ingredients w/ provenance tags + numbered method, Start cooking/Save/Share). BranchRow (4 tiles) renders below the 861px fold; verified functionally by `generation.test.tsx` + `generation.spec.ts`. |

### Web fidelity divergences (intentional / scoped)

- **WebShell chrome** (top search bar + notification bell + "Add ingredient",
  sidebar "LISTS" group) and the Home **bottom stats bar** ("4 of 7 nights · $142
  saved") appear in the board but are **out of M4 scope** — the WebShell topbar
  slots and the stats strip are not part of the §01/§04/§02 content this slice
  ships. No layout drift in the parts M4 owns.
- **"Recently saved" card is empty** — recently-saved recipes need the library
  read (M5). The card structure/heading render; rows populate once M5 lands.
- **Drafting single-recipe variant** — the board's "Recipe 1 of 3" + queued cards
  are intentionally dropped (one recipe per request); see `docs/decisions.md`.
- **Capture-time elapsed readouts** ("stream open · 11.7s", "Thought for 11.0s")
  read higher than the board's because `MOCK_STREAM_DELAY_MS` paces frames at 1 s
  to freeze a mid-stream snapshot; with the default (0) the readouts are small.

## Mobile frames (§01/§04/§02) — deferred to Slice G

References captured and committed; visual approval pending Slice G (mobile UI),
which is not part of this work:

| # | Frame | Reference | Status |
| - | ----- | --------- | ------ |
| 5 | Mobile · Home §01 | `home--mobile-home.png` | references captured · pending Slice G |
| 6 | Mobile · Home · selecting §01 | `home--mobile-home-selecting.png` | references captured · pending Slice G |
| 7 | Mobile · Home · browse pantry §01 | `home--mobile-home-browse-pantry.png` | references captured · pending Slice G |
| 8 | Mobile · 1. Thinking §04 | `generating-state--mobile-1-thinking.png` | references captured · pending Slice G |
| 9 | Mobile · 2. Drafting §04 | `generating-state--mobile-2-drafting.png` | references captured · pending Slice G |
| 10 | Mobile · Result §02 | `result-after-generation--mobile-result.png` | references captured · pending Slice G |

## Functional verification (done, green)

- **Unit/contract/integration:** `pnpm test` — contracts, AI service (partial
  parser, emitter, orchestrator incl. abort/error, mock-tape replay, SSE route),
  API (`generateStream` integration: events flow, single-write persistence,
  real-id `done`, unsubscribe→aborted, UNAUTHORIZED), api-client (subscription
  link selection + `withCredentials`), web `useGeneration` (12) + `HomeScreen` +
  `BranchRow` + `generation` happy-path. All green.
- **Types & lint:** `pnpm typecheck` (0 errors) + `pnpm lint` (`--max-warnings 0`).
- **SSE transport spike (E2):** incremental non-buffered delivery proven
  end-to-end through the real API tRPC subscription; see `docs/decisions.md`.
- **Web e2e (H4):** `e2e/web/specs/generation.spec.ts` — sign in → Home → prompt →
  Thinking → Drafting → Result → branch tile re-runs (mock provider).
