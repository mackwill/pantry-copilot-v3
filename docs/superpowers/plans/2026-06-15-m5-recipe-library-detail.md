# M5 — Recipe library + detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per slice; run `pnpm lint && pnpm typecheck && pnpm test` before any commit that claims completion (`podman compose -f infra/podman/compose.yaml up -d` first — the `@pantry/api` suites need live postgres).
>
> **Before starting:** set M5 to `in progress` in the roadmap Status table (`docs/superpowers/specs/2026-06-10-v3-rewrite-roadmap.md`) and link this plan. **On completion:** mark M5 done in that table and commit.

**Goal:** Ship the recipe-library vertical slice — board §03 library (web **Cook · empty**, mobile **Cook · default** + **New-tapped** `NewAskSheet`) and §05/§07 recipe detail (web **Recipe detail**, mobile **Recipe detail** with its inline in-pantry ingredient block). M4 already **persists** every generated recipe (`recipes` + `recipe_generation_jobs`); M5 reads those rows back as a browsable, favoritable library and gives each recipe a full detail page. No new persistence of recipe bodies — only a `recipe_favorites` join table.

**Architecture:** Vertical slice in roadmap order **contracts → DB → API → web UI → mobile UI → fidelity gate → e2e**. New read queries (`recipes.list`, `recipes.byId`) and a favorites mutation (`recipes.setFavorite`) extend the existing `recipesRouter` (which today only holds `generateStream`). The library list derives its fields from each row's `data jsonb` (the stored `AIRecipe`) joined against a `recipe_favorites` table; the detail page reuses the M4 recipe vocabulary (`recipeFormat.ts`, ingredient provenance tags). The generation **prompt** moves off the Cook surface so Cook can become the library: web keeps generation at `/cook` and hosts the library under the existing **Recipes** nav item; mobile relocates the generation Home from the Cook tab to the (currently placeholder) Home tab and makes Cook the library, with the prompt reachable via the `NewAskSheet` bottom sheet.

**Tech Stack:** Zod (`@pantry/contracts`) · Drizzle + PostgreSQL (`recipe_favorites` table + migration `0004`) · tRPC v11 query/mutation procedures (`@pantry/api`, typed straight through `@pantry/api-client`) · TanStack Start + React + CSS Modules (web) · Expo Router + canonical `BottomSheet` (mobile) · Vitest + Testing Library + Playwright/Maestro · pixelmatch fidelity harness.

---

## Context

M4 lit up the generation loop and, per its scope decision (b), **persisted every recipe**: the `recipes` table holds `{ id, userId, prompt, weirdness, title, summary, data: jsonb<AIRecipe>, provider, model, tokensUsed, createdAt }` and `recipe_generation_jobs` tracks each stream's lifecycle (`services/api/src/db/schema/recipes.ts`). The `recipes.generateStream` subscription writes the row once on `done` and re-emits the real `recipeId` (`services/api/src/trpc/routers/recipes.ts`). M5 is the **read** half: surface those rows as a library, let users favorite them, and open any one as a full recipe page. The repo sits at zero TS errors / zero lint warnings across all workspaces.

The established slice pattern holds: `@pantry/contracts` is the Zod source of truth → Drizzle schema seeded from those enums → tRPC `protectedProcedure` → web/mobile features (`strings.ts` + hooks + `components/` ≤300 lines, route files composition-only) → pixelmatch fidelity gate in `docs/checklists/` → e2e. M5 introduces **no streaming and no AI** — it is the calmest milestone since M2, mostly query plumbing and two faithful screen compositions per platform.

**Why now:** generation without a library is a leak — recipes vanish after the Result screen. M6 (cook sessions) starts a cook *from* a library recipe and writes session/resume state back onto these same surfaces (the board's "Recent sessions" / resume banner). M7 (recipe chat) opens from the detail page. Getting the library queries, the favorites table, the detail composition, and the Cook-vs-Home IA right here is the foundation those milestones build on.

### The 5 M5 frames

| #  | Frame label (board)        | Section | Platform | Manifest reference | Notes |
| -- | -------------------------- | ------- | -------- | ------------------ | ----- |
| 1  | Web · Cook · empty         | §03     | web      | `cook-tab-library--web-cook-empty.png` (1280×860) | Library landing: "Nothing on the stove" hero + 2 cards (library / cook-new) + recent list |
| 2  | Web · Recipe detail        | §05/§07 | web      | `inventory-recipe-detail--web-recipe-detail.png` (1280×860) | Two-column: method + sticky ingredients-in-pantry card + copilot note |
| 3  | Mobile · Cook · default    | §03     | mobile   | `cook-tab-library--mobile-cook-default.png` (390×800) | Header + counts + filter pills + recipe cards + recently-cooked + "Cook something new" |
| 4  | Mobile · Cook · new-tapped | §03     | mobile   | `cook-tab-library--mobile-cook-new-tapped.png` (390×800) | `NewAskSheet` over the library (prompt + weirdness + chips, "Cook this") |
| 5  | Mobile · Recipe detail     | §05/§07 | mobile   | `mobile-pantry-recipe--recipe-detail.png` (390×800) | Header + meta + inline in-pantry ingredient block + method + Start cooking |

Board source (v2, reference-only): all 5 references are **already captured + committed** under `tools/design-fidelity/references/` (the board was swept once in M0). Compositions to consult:
- Web Cook · empty → `claudeDesignOutput/screens/home-cook-v2.jsx` `WebCookTabEmpty` (lines ~1142–1224).
- Mobile Cook · default → `home-cook-v2.jsx` `MobileCookTabEmpty` (lines ~1358–1585); `NewAskSheet` (lines ~1604–1655).
- Web Recipe detail → `claudeDesignOutput/screens/web-screens-b.jsx` `WebRecipeDetail` (lines ~98–214).
- Mobile Recipe detail → `claudeDesignOutput/screens/mobile-screens-b.jsx` `MobileRecipe` (lines ~3–78).

> **Board frame `cook-tab-library--mobile-cook-with-resume.png` (resume banner) is out of M5 scope** — it depends on an active cook session and is gated by M6. The `MobileCookTabEmpty` `resume` prop stays unset in M5.

### Scope decisions (to settle in code + log in `docs/decisions.md`)

- **(A) Cook becomes the library; the generation prompt moves to Home/“new”.** The board (line ~1351 comment in `home-cook-v2.jsx`) is explicit: *"The tab is now the recipes library… The prompt for new asks stays on Home."* Concretely:
  - **Web:** keep the M4 generation Home at `/cook` (activeId `cook`, unchanged). Host the **library** under the existing **Recipes** sidebar item: `/recipes` (activeId `recipes`) for the list/empty state, `/recipes/$recipeId` for detail. The board's "Web · Cook · empty" frame is matched at the **`/recipes` empty state** — the only divergence from the reference is the highlighted nav item (board highlights *Cook*, v3 highlights *Recipes*, because v3's sidebar carries a dedicated Recipes item the mobile tab-bar lacks). Logged.
  - **Mobile:** the tab-bar has no Recipes tab, so the library lives on the **Cook tab** (`(tabs)/cook.tsx`), and the generation Home **relocates from the Cook tab to the Home tab** (`(tabs)/index.tsx`, currently a `PlaceholderScreen`). The prompt stays reachable from Cook via the **`NewAskSheet`** ("New" button / "Cook something new" row). The M4 "Mobile · Home" frame composition is unchanged — only its host tab changes; it is re-verified at the Home tab in this milestone's gate.
- **(B) Favorites are a join table, not a recipe column.** Add `recipe_favorites (user_id, recipe_id)` (composite PK). `recipes.setFavorite` inserts/deletes idempotently; `list`/`byId` left-join it into a `favorited: boolean`. Keeps the recipe body immutable and lets favorites be per-user even once recipes are shareable. The M4 `recipeSchema` (persisted DTO, also used by the `done` re-emit) is **left untouched**; detail adds a separate `recipeDetailSchema = recipeSchema.extend({ favorited })`.
- **(C) Recent/“recently cooked”/“recent sessions” blocks are session-derived → deferred to M6.** The board's Cook frames show a "Recent sessions" (web) / "Recently cooked" (mobile) list whose statuses ("finished · saved", "cooked 7×", "stopped at step 2") are **cook-session** concepts with no M5 data source. For M5 these blocks render from the persisted recipe rows as a **"Recently generated"** list (title + relative time + difficulty/weirdness pill) — same layout, session-truthful data deferred. Logged; the M6 plan replaces the data source.
- **(D) "Start cooking", "Share", "Print" stay stubs until M6.** Per the M4 precedent (decision (g)), detail/library "Start cooking" navigates nowhere yet (no-op handler wired for M6), and Share/Print are no-ops. **"Save"/bookmark is live** (toggles a favorite) — this is the one M4 stub M5 fulfils.
- **(E) Library list fields derive from `data jsonb`.** `timeMinutes`, `difficulty`, `pantryItemsUsed` come from the stored `AIRecipe` body; `title`, `summary`, `weirdness`, `createdAt` from the row columns. No schema change to `recipes`.

### Key v2 reference files (consult, never copy)

| Concern | path |
| ------- | ---- |
| Web Cook · empty composition | `pantry-copilot-v2/claudeDesignOutput/screens/home-cook-v2.jsx` `WebCookTabEmpty` |
| Mobile Cook · default + `NewAskSheet` | `…/home-cook-v2.jsx` `MobileCookTabEmpty`, `NewAskSheet` |
| Web Recipe detail composition | `…/screens/web-screens-b.jsx` `WebRecipeDetail` |
| Mobile Recipe detail composition | `…/screens/mobile-screens-b.jsx` `MobileRecipe` |
| Recipe vocabulary already in v3 (reuse) | `apps/web/src/features/generation/recipeFormat.ts`, `apps/mobile/src/features/generation/recipeFormat.ts`, `OneRecipeCard*.tsx` |
| Persisted recipe shape | `services/api/src/db/schema/recipes.ts`, `services/api/src/trpc/routers/recipes.ts` |
| Web nav items / shell | `apps/web/src/features/pantry-shared/nav.ts`, `packages/design-system/src/web/WebShell/WebShell.tsx` |
| Mobile tabs | `apps/mobile/src/app/(tabs)/_layout.tsx` |

---

## Domain model additions (`@pantry/contracts`)

New `recipes/library.ts`. Reuse the existing `recipeSchema`, `recipeDifficultySchema`, `aiRecipeSchema` from M4 — **do not** modify them.

```ts
// recipes/library.ts
import { z } from 'zod';
import { recipeDifficultySchema } from './enums';
import { recipeSchema } from './recipe';

/** Board filter pills → server filter. (Mobile shows All/Tonight/Saved/Cooked/Want-to-try;
 *  M5 implements the data-backed subset; the rest render disabled until M6 sessions.) */
export const RECIPE_LIBRARY_FILTERS = ['all', 'favorites', 'recent'] as const;
export const recipeLibraryFilterSchema = z.enum(RECIPE_LIBRARY_FILTERS);
export type RecipeLibraryFilter = z.infer<typeof recipeLibraryFilterSchema>;

export const recipeListQuerySchema = z.object({
  filter: recipeLibraryFilterSchema.default('all'),
  limit: z.number().int().min(1).max(100).default(50),
});
export type RecipeListQuery = z.infer<typeof recipeListQuerySchema>;

/** Compact row for the library list — derived from the row columns + `data` jsonb. */
export const recipeListItemSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  summary: z.string().nullable(),
  timeMinutes: z.number().int().min(1),
  difficulty: recipeDifficultySchema,
  weirdness: z.number().int().min(0).max(100),
  pantryItemsUsed: z.array(z.string()),
  favorited: z.boolean(),
  createdAt: z.string(),
});
export type RecipeListItem = z.infer<typeof recipeListItemSchema>;

/** Full detail DTO — the persisted recipe plus this user's favorite flag. */
export const recipeDetailSchema = recipeSchema.extend({ favorited: z.boolean() });
export type RecipeDetail = z.infer<typeof recipeDetailSchema>;

export const setFavoriteInputSchema = z.object({ recipeId: z.uuid(), favorited: z.boolean() });
export type SetFavoriteInput = z.infer<typeof setFavoriteInputSchema>;

export const recipeByIdInputSchema = z.object({ recipeId: z.uuid() });
```

All exported from the `@pantry/contracts` barrel (`packages/contracts/src/index.ts`).

---

# Slice A — Contracts: library query, list item, detail DTO, favorites input

**Files:**
- Create: `packages/contracts/src/recipes/library.ts`
- Modify: `packages/contracts/src/index.ts` (barrel — export `./recipes/library.js`)
- Test: `packages/contracts/src/recipes/library.test.ts`

### Tasks

- [ ] **A1 — Write the failing tests.**

```ts
// packages/contracts/src/recipes/library.test.ts
import { describe, expect, it } from 'vitest';
import {
  recipeByIdInputSchema,
  recipeDetailSchema,
  recipeListItemSchema,
  recipeListQuerySchema,
  recipeLibraryFilterSchema,
  setFavoriteInputSchema,
} from './library';
import { aiRecipeSchema } from './recipe';

const baseRecipe = {
  title: 'Charred scallion oil noodles',
  summary: 'A weeknight rerun done right.',
  weirdnessScore: 38,
  ingredients: [{ name: 'Scallions' }],
  steps: ['Boil water.'],
  timeMinutes: 12,
  difficulty: 'easy' as const,
  whySuggested: 'Uses your scallions.',
};

describe('recipeLibraryFilterSchema', () => {
  it('accepts the known filters and rejects others', () => {
    expect(recipeLibraryFilterSchema.parse('favorites')).toBe('favorites');
    expect(() => recipeLibraryFilterSchema.parse('want-to-try')).toThrow();
  });
});

describe('recipeListQuerySchema', () => {
  it('defaults filter=all and limit=50', () => {
    expect(recipeListQuerySchema.parse({})).toEqual({ filter: 'all', limit: 50 });
  });
  it('rejects a limit above 100', () => {
    expect(() => recipeListQuerySchema.parse({ limit: 500 })).toThrow();
  });
});

describe('recipeListItemSchema', () => {
  it('parses a compact list row', () => {
    const row = {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'X',
      summary: null,
      timeMinutes: 12,
      difficulty: 'easy',
      weirdness: 38,
      pantryItemsUsed: ['scallions'],
      favorited: true,
      createdAt: '2026-06-15T00:00:00.000Z',
    };
    expect(recipeListItemSchema.parse(row).favorited).toBe(true);
  });
});

describe('recipeDetailSchema', () => {
  it('is the AI recipe + persistence identity + favorited', () => {
    const recipe = aiRecipeSchema.parse(baseRecipe);
    const detail = recipeDetailSchema.parse({
      ...recipe,
      id: '11111111-1111-1111-1111-111111111111',
      userId: 'user_1',
      prompt: 'noodles',
      weirdness: 38,
      createdAt: '2026-06-15T00:00:00.000Z',
      favorited: false,
    });
    expect(detail.favorited).toBe(false);
    expect(detail.title).toBe(baseRecipe.title);
  });
});

describe('setFavoriteInputSchema + recipeByIdInputSchema', () => {
  it('require a uuid recipeId', () => {
    expect(() => setFavoriteInputSchema.parse({ recipeId: 'nope', favorited: true })).toThrow();
    expect(recipeByIdInputSchema.parse({ recipeId: '11111111-1111-1111-1111-111111111111' }).recipeId).toMatch(/^1{8}/);
  });
});
```

- [ ] **A2 — Run the tests; verify they fail.** Run: `pnpm --filter @pantry/contracts test library` — Expected: FAIL ("Cannot find module './library'").

- [ ] **A3 — Implement `recipes/library.ts`** exactly as in the **Domain model additions** block above, then add `export * from './recipes/library.js';` to `packages/contracts/src/index.ts`.

- [ ] **A4 — Run the tests; verify they pass.** Run: `pnpm --filter @pantry/contracts test library` — Expected: PASS. Then `pnpm --filter @pantry/contracts typecheck`.

- [ ] **A5 — Commit.**

```bash
git add packages/contracts/src/recipes/library.ts packages/contracts/src/recipes/library.test.ts packages/contracts/src/index.ts
git commit -m "feat(contracts): recipe library query, list item, detail DTO + favorites input"
```

---

# Slice B — DB: `recipe_favorites` table + migration

**Files:**
- Create: `services/api/src/db/schema/favorites.ts`
- Modify: `services/api/src/db/schema/index.ts` (barrel — `export * from './favorites.js'`)
- Generated: `services/api/drizzle/0004_*.sql` + meta

### Tasks

- [ ] **B1 — Write the schema.**

```ts
// services/api/src/db/schema/favorites.ts
import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { recipes } from './recipes.js';

/** Per-user recipe favorites. Composite PK makes (un)favorite idempotent. */
export const recipeFavorites = pgTable(
  'recipe_favorites',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })],
);
```

Add `export * from './favorites.js';` to `services/api/src/db/schema/index.ts`.

- [ ] **B2 — Generate the migration.** Run: `pnpm --filter @pantry/api db:generate` — Expected: a new `services/api/drizzle/0004_*.sql` creating `recipe_favorites` with the composite PK + two FKs. Inspect the SQL to confirm `ON DELETE CASCADE` on both references and no destructive change to existing tables.

- [ ] **B3 — Apply + typecheck.** Run: `podman compose -f infra/podman/compose.yaml up -d && pnpm --filter @pantry/api db:migrate && pnpm --filter @pantry/api typecheck` — Expected: migration applies clean; 0 TS errors.

- [ ] **B4 — Commit.**

```bash
git add services/api/src/db/schema/favorites.ts services/api/src/db/schema/index.ts services/api/drizzle/
git commit -m "feat(api): recipe_favorites table + migration 0004"
```

---

# Slice C — API: `recipes.list` + `recipes.byId` + `recipes.setFavorite`

Extend the existing `recipesRouter` (currently `generateStream` only). All three are `protectedProcedure`, scoped to `ctx.session.user.id`.

**Files:**
- Modify: `services/api/src/trpc/routers/recipes.ts` (add the three procedures + a row→DTO mapper)
- Test: `services/api/test/recipes-library.integration.test.ts`

### Mapper + procedures (reference implementation)

```ts
// add to services/api/src/trpc/routers/recipes.ts
import {
  type RecipeDetail,
  type RecipeListItem,
  recipeByIdInputSchema,
  recipeListQuerySchema,
  setFavoriteInputSchema,
} from '@pantry/contracts';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { recipeFavorites, recipes } from '../../db/schema/index.js';

type RecipeRow = typeof recipes.$inferSelect;

function toListItem(row: RecipeRow, favorited: boolean): RecipeListItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    timeMinutes: row.data.timeMinutes,
    difficulty: row.data.difficulty,
    weirdness: row.weirdness,
    pantryItemsUsed: row.data.pantryItemsUsed,
    favorited,
    createdAt: row.createdAt.toISOString(),
  };
}

function toDetail(row: RecipeRow, favorited: boolean): RecipeDetail {
  return {
    ...row.data,
    id: row.id,
    userId: row.userId,
    prompt: row.prompt,
    weirdness: row.weirdness,
    createdAt: row.createdAt.toISOString(),
    favorited,
  };
}
```

Procedures (added to the `router({ ... })`):

```ts
  list: protectedProcedure.input(recipeListQuerySchema).query(async ({ ctx, input }): Promise<RecipeListItem[]> => {
    const userId = ctx.session.user.id;
    const favRows = await ctx.db.select({ recipeId: recipeFavorites.recipeId }).from(recipeFavorites).where(eq(recipeFavorites.userId, userId));
    const favIds = new Set(favRows.map((f) => f.recipeId));

    const rows = await ctx.db.select().from(recipes).where(eq(recipes.userId, userId)).orderBy(desc(recipes.createdAt)).limit(input.limit);
    const filtered = input.filter === 'favorites' ? rows.filter((r) => favIds.has(r.id)) : rows;
    return filtered.map((r) => toListItem(r, favIds.has(r.id)));
  }),

  byId: protectedProcedure.input(recipeByIdInputSchema).query(async ({ ctx, input }): Promise<RecipeDetail> => {
    const userId = ctx.session.user.id;
    const [row] = await ctx.db.select().from(recipes).where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)));
    if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
    const [fav] = await ctx.db
      .select()
      .from(recipeFavorites)
      .where(and(eq(recipeFavorites.userId, userId), eq(recipeFavorites.recipeId, row.id)));
    return toDetail(row, fav !== undefined);
  }),

  setFavorite: protectedProcedure.input(setFavoriteInputSchema).mutation(async ({ ctx, input }): Promise<{ favorited: boolean }> => {
    const userId = ctx.session.user.id;
    const [owned] = await ctx.db.select({ id: recipes.id }).from(recipes).where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)));
    if (owned === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
    if (input.favorited) {
      await ctx.db.insert(recipeFavorites).values({ userId, recipeId: input.recipeId }).onConflictDoNothing();
    } else {
      await ctx.db.delete(recipeFavorites).where(and(eq(recipeFavorites.userId, userId), eq(recipeFavorites.recipeId, input.recipeId)));
    }
    return { favorited: input.favorited };
  }),
```

> `recipe_recent`/`'recent'` filter behaves identically to `'all'` in M5 (newest-first is already the default order); it exists so the UI's "Recent" pill is data-backed without a behavior change. Note this inline.

### Tasks

- [ ] **C1 — Write the failing integration test.** Mirror the existing `services/api/test/*.integration.test.ts` harness (ephemeral DB + a signed-in caller). Cover:
  - `list` returns only the caller's recipes, newest first, mapping `timeMinutes`/`difficulty`/`pantryItemsUsed` out of `data`;
  - `setFavorite({favorited:true})` then `list({filter:'favorites'})` returns exactly that recipe with `favorited:true`; `setFavorite({favorited:false})` removes it; double-favorite is idempotent (no PK violation);
  - `byId` returns the full detail DTO incl. `favorited`; `byId` for another user's recipe → `NOT_FOUND`; `setFavorite` on a non-owned/missing recipe → `NOT_FOUND`;
  - all three are `UNAUTHORIZED` without a session.

```ts
// services/api/test/recipes-library.integration.test.ts (shape — fill bodies from the existing harness)
import { describe, expect, it } from 'vitest';
// ...import the project's test helpers: withTestDb / makeCaller / seedUser / insertRecipe...

describe('recipes library', () => {
  it('lists only the caller\'s recipes, newest first', async () => { /* insert 2 recipes for userA, 1 for userB; assert caller A sees 2 in desc(createdAt) */ });
  it('favorites are idempotent and filterable', async () => { /* setFavorite twice; list({filter:"favorites"}).length === 1 */ });
  it('byId returns detail with favorited and 404s across users', async () => { /* ... */ });
  it('rejects unauthenticated callers', async () => { /* anon caller → UNAUTHORIZED for list/byId/setFavorite */ });
});
```

- [ ] **C2 — Run; verify it fails.** Run: `podman compose -f infra/podman/compose.yaml up -d && pnpm --filter @pantry/api test recipes-library` — Expected: FAIL (`list`/`byId`/`setFavorite` not a function).

- [ ] **C3 — Implement** the mapper + three procedures in `services/api/src/trpc/routers/recipes.ts` exactly as above.

- [ ] **C4 — Run; verify it passes + typecheck.** Run: `pnpm --filter @pantry/api test recipes-library && pnpm --filter @pantry/api typecheck` — Expected: PASS, 0 TS errors.

- [ ] **C5 — Commit.**

```bash
git add services/api/src/trpc/routers/recipes.ts services/api/test/recipes-library.integration.test.ts
git commit -m "feat(api): recipes.list + byId + setFavorite (library queries + favorites)"
```

> The typed client picks these up automatically — `api.recipes.list.query(...)`, `api.recipes.byId.query(...)`, `api.recipes.setFavorite.mutate(...)` are available in `@pantry/api-client` with **no api-client change**. (Confirm by typechecking the web app in Slice E.)

---

# Slice D — Web UI: Recipe Library (`/recipes`) + Recipe Detail (`/recipes/$recipeId`)

Two routes under the existing **Recipes** nav. Decompose hard: route files composition-only; components ≤200 LOC; all copy in `strings.ts`; a `useFavorite` hook owns the optimistic favorite toggle. Reuse `recipeFormat.ts` (`formatIngredient`, `ingredientTag`) from the generation feature.

**Files:**
- Create routes: `apps/web/src/routes/_authed/recipes.index.tsx` (→ `<RecipeLibraryScreen/>`), `apps/web/src/routes/_authed/recipes.$recipeId.tsx` (→ `<RecipeDetailScreen/>`). Both `ssr: false`; loaders call `api.recipes.list.query({})` / `api.recipes.byId.query({ recipeId })` + `api.user.me.query()` (mirror `cook.index.tsx`).
- Create feature `apps/web/src/features/library/`: `strings.ts`, `components/RecipeLibraryScreen.tsx`, `components/RecipeLibraryEmpty.tsx`, `components/RecipeListCard.tsx`, `components/LibraryFilters.tsx`, `library.module.css`.
- Create feature `apps/web/src/features/recipe-detail/`: `strings.ts`, `useFavorite.ts`, `components/RecipeDetailScreen.tsx`, `components/IngredientChecklist.tsx`, `components/RecipeMethod.tsx`, `components/CopilotNote.tsx`, `recipe-detail.module.css`.
- Modify: `apps/web/src/features/pantry-shared/nav.ts` is already correct (it has the `recipes` item) — wire `recipes` in the route→nav map the screens use for `onNavigate` (copy the `NAV_ROUTES` pattern from the generation `HomeScreen`).
- Test: `apps/web/src/features/library/components/RecipeLibraryScreen.test.tsx`, `apps/web/src/features/recipe-detail/components/RecipeDetailScreen.test.tsx`, `apps/web/src/features/recipe-detail/useFavorite.test.ts` (**web slice without tests does not merge**).

### Composition notes (match the board)

- **`RecipeLibraryScreen`** (board "Web · Cook · empty", `WebCookTabEmpty`): `<WebShell navItems={appNavItems} activeId="recipes" user={...} onNavigate={...}>`. When `items.length === 0` → `<RecipeLibraryEmpty/>`: `Eyebrow "Cook"` + 56px display headline ("Nothing on the stove / right now."), muted subhead, a 2-up `Card` grid — **"Pick from your library"** (book-open icon, count) and **"Cook something new"** (accent border + `accentSoft`, sparkles icon, italic "Ask in your own words…", arrow-right; `onClick` → navigate to `/cook`). Below: `Eyebrow "Recently generated"` (decision C) listing the persisted recipes as rows (title + mono `createdAt`-relative + difficulty/weirdness). When `items.length > 0` → the same shell with `<LibraryFilters/>` (All / Favorites / Recent — the data-backed subset; render the board's Tonight/Cooked/Want-to-try pills **disabled** with a `title` note until M6) + a list of `<RecipeListCard/>`.
- **`RecipeListCard`**: a row card — title (italic when weirdness is high), mono time, summary line, a tone pill (difficulty/weirdness band), favorited bookmark, `createdAt`-relative. Whole card is a link to `/recipes/$recipeId`.
- **`RecipeDetailScreen`** (board "Web · Recipe detail", `WebRecipeDetail`): `<WebShell activeId="recipes" hideTopbar>`. Top row: ghost "Back to recipes" (`Icon arrow-left` → `/recipes`) + "· generated {relative}" + right-aligned `Save`(bookmark, **live** via `useFavorite`) / `Share` / `Print` (stubs). Body grid `1.4fr 1fr`: **left** = `Eyebrow` meta line, 64px display title, summary `p`, a 5-cell meta strip (time/serves/effort/cost/cal — only time/difficulty are real; serves/cost/cal are **board-fixture-derived placeholders**, note in strings/decisions), `<RecipeMethod/>` (numbered italic-accent steps from `recipe.steps`), and a `<CopilotNote/>` card (`accentSoft`, sparkles, `recipe.observation ?? whySuggested`). **Right** (sticky) = `<IngredientChecklist/>` Card: "Ingredients · N servings" + a "M of N in pantry" success pill, each ingredient with a check disc (filled when `ingredientTag(i, pantryItemsUsed) !== 'optional'`) + mono quantity, then a full-width "Start cooking" primary (stub, decision D); plus a "Could also use" pills card from `recipe.substitutions`.
- **`useFavorite`** owns optimistic state: seeds from `recipe.favorited`, on toggle flips local state then `api.recipes.setFavorite.mutate({ recipeId, favorited })`, reverting on error. Unit-test the optimistic flip + revert with a mocked client.

### Tasks

- [ ] **D1 — Strings first.** Write `apps/web/src/features/library/strings.ts` and `apps/web/src/features/recipe-detail/strings.ts` with every board literal (headline, subhead, card eyebrows/titles, filter labels, meta keys, action labels, "Notes from the copilot", "Could also use", relative-time formatter labels). No JSX literals anywhere downstream (`react/jsx-no-literals` is on).

- [ ] **D2 — `useFavorite` hook (TDD).** Write `useFavorite.test.ts` (mock `api.recipes.setFavorite`): asserts initial state from `favorited`, optimistic flip on toggle, and revert when the mutation rejects. Run → FAIL. Implement `useFavorite.ts`. Run → PASS.

- [ ] **D3 — Library list + empty (TDD).** Write `RecipeLibraryScreen.test.tsx`: renders the empty state ("Nothing on the stove", both cards) for `items: []`; renders one `RecipeListCard` per item with title + a link to `/recipes/$id` for a populated list; favorited items show a filled bookmark. Run → FAIL. Build `RecipeLibraryScreen`, `RecipeLibraryEmpty`, `RecipeListCard`, `LibraryFilters`, `library.module.css` (token vars only — `var(--accent)`, `var(--raised)`, `var(--line)`, fonts). Wire `recipes.index.tsx` (loader → screen). Run → PASS.

- [ ] **D4 — Recipe detail (TDD).** Write `RecipeDetailScreen.test.tsx`: renders title/summary/meta/method/ingredients from a fixture `RecipeDetail`; the in-pantry pill reads "M of N in pantry"; clicking Save calls `setFavorite`. Run → FAIL. Build `RecipeDetailScreen`, `IngredientChecklist`, `RecipeMethod`, `CopilotNote`, `recipe-detail.module.css`. Wire `recipes.$recipeId.tsx` (loader → screen; loader throws → TanStack `notFound` on `NOT_FOUND`). Run → PASS.

- [ ] **D5 — Cross-wire the M4 stubs.** In `apps/web/src/features/generation/components/OneRecipeCard.tsx`, point the Result screen's **"Save"** at `useFavorite` (the recipe is already persisted with a real `recipeId` from the `done` re-emit) and have the title/card link to `/recipes/$recipeId`. Keep "Start cooking" a stub. Update the M4 generation test only if a literal assertion changes. (Small, contained — do **not** restructure the generation feature.)

- [ ] **D6 — Gates + commit.** Run: `pnpm --filter @pantry/web lint && pnpm --filter @pantry/web typecheck && pnpm --filter @pantry/web test` — Expected: all green, `--max-warnings 0`, every new component ≤300 LOC.

```bash
git add apps/web/src/routes/_authed/recipes.index.tsx apps/web/src/routes/_authed/recipes.$recipeId.tsx apps/web/src/features/library apps/web/src/features/recipe-detail apps/web/src/features/generation/components/OneRecipeCard.tsx
git commit -m "feat(web): recipe library + recipe detail + live favorites (board §03/§05/§07)"
```

---

# Slice E — Mobile UI: Cook tab → library, Home tab ← generation, `NewAskSheet`, Recipe detail

Cook becomes the library (decision A); the generation Home relocates to the Home tab; the prompt is reachable from Cook via `NewAskSheet`. Reuse the generation feature's `WeirdnessControl`, `SuggestionPills`/chips, `recipeFormat.ts`, and the canonical `BottomSheet`.

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/cook.tsx` → `<RecipeLibraryScreen/>`; `apps/mobile/src/app/(tabs)/index.tsx` → the relocated generation `<HomeScreen/>` (from `features/generation`).
- Create stack route: `apps/mobile/src/app/(recipe)/_layout.tsx` (Stack, `headerShown:false`) + `apps/mobile/src/app/(recipe)/[recipeId].tsx` → `<RecipeDetailScreen/>`.
- Create feature `apps/mobile/src/features/library/`: `strings.ts`, `useLibrary.ts` (wraps `api.recipes.list.query`), `components/RecipeLibraryScreen.tsx`, `components/LibraryHeader.tsx`, `components/LibraryFilters.tsx`, `components/RecipeListCard.tsx`, `components/RecentlyGenerated.tsx`, `components/CookNewButton.tsx`, `sheets/NewAskSheet.tsx`.
- Create feature `apps/mobile/src/features/recipe-detail/`: `strings.ts`, `useFavorite.ts`, `components/RecipeDetailScreen.tsx`, `components/IngredientBlock.tsx`, `components/RecipeMethod.tsx`.
- Test: `apps/mobile/src/features/library/components/RecipeLibraryScreen.test.tsx`, `apps/mobile/src/features/library/sheets/NewAskSheet.test.tsx`, `apps/mobile/src/features/recipe-detail/useFavorite.test.ts` (+ `testID`s for Maestro: `library-screen`, `recipe-card`, `cook-new-button`, `new-ask-sheet`, `recipe-detail`, `favorite-button`).

### Composition notes (match the board)

- **`RecipeLibraryScreen`** (board "Mobile · Cook · default", `MobileCookTabEmpty`, `resume` unset): `<MScreen>` + `<MTabBar active="cook"/>`. `LibraryHeader`: `Eyebrow "Cook"`, right cluster of search + sort icons + an accent **"✦ New"** pill button (opens `NewAskSheet`). 36px display headline ("What's it / gonna be?"), a counts line (`{N} saved · … cooked · … want to try` — saved/cooked/want-to-try counts are session-derived → in M5 show `{N} saved` from the real list count, rest deferred, decision C). `LibraryFilters` (horizontal scroll pills: All / Tonight / Saved / Cooked / Want to try — All + Saved data-backed, others disabled until M6). A column of `RecipeListCard` (title, mono time, desc, tone pill + mono "when"). `RecentlyGenerated` terse one-line list (decision C). `CookNewButton` (accentSoft, sparkles disc, italic "Cook something new…", arrow-right → `NewAskSheet`). Cards/`onPress` → `router.push('/(recipe)/' + id)`.
- **`NewAskSheet`** (board "Mobile · Cook · new-tapped", `NewAskSheet`): canonical `BottomSheet` (`eyebrow="New recipe"`, `title="What are you hungry for?"`, footer = mic button + "uses your pantry · ~N tokens" + primary **"Cook this"** with arrow-right). Body: serif italic placeholder prompt + caret, a bordered `WeirdnessControl` band, `Eyebrow "Try"` + outline chips (reuse the generation suggestion list). "Cook this" reuses the generation submit: navigate to the generate route (`/(generate)/generate`) with `{ prompt, weirdness }` — **the existing M4 generate flow, unchanged**.
- **`RecipeDetailScreen`** (board "Mobile · Recipe detail", `MobileRecipe`): `<MScreen>` header row (chevron-left back; bookmark **live** via `useFavorite` + share stub). `Eyebrow` meta, 38px display title, summary `p`, a 3-cell meta strip (time/serves/cost — only time real; serves/cost are board placeholders, noted). **`IngredientBlock`** — the inline in-pantry panel (the §★ "inline pantry block" the roadmap calls out): `Eyebrow "Ingredients"` + "M of N in pantry" success pill, a raised rounded card listing each ingredient with a filled accent check disc + name + mono quantity. `RecipeMethod` numbered italic-accent steps. Full-width "Start cooking" primary (timer icon, stub — decision D).
- **`useFavorite`** (mobile): same optimistic pattern as web, RN-friendly (no DOM). Share with web by intent, not code (separate file — RN vs web client imports differ).

### Tasks

- [ ] **E1 — Relocate generation Home → Home tab.** Point `(tabs)/index.tsx` at `features/generation` `HomeScreen` (it currently renders `PlaceholderScreen`); leave `(tabs)/cook.tsx` temporarily until E2 swaps it. Verify the generate flow still launches from the Home tab. Commit-worthy on its own but can fold into E-final.

- [ ] **E2 — Library screen + `NewAskSheet` (TDD).** Write `RecipeLibraryScreen.test.tsx` (renders header/counts/filters; one `RecipeListCard` per item; `cook-new-button` opens the sheet) and `NewAskSheet.test.tsx` (renders prompt + weirdness + chips; "Cook this" calls the navigate spy with `{prompt, weirdness}`). Run → FAIL. Build `useLibrary`, the library components + sheet, point `(tabs)/cook.tsx` at `<RecipeLibraryScreen/>`. Run → PASS.

- [ ] **E3 — Recipe detail + favorites (TDD).** Write `useFavorite.test.ts` (optimistic flip + revert) and a `RecipeDetailScreen` smoke test (title/ingredients/"M of N in pantry"/method from a fixture). Run → FAIL. Build `useFavorite`, the detail components, the `(recipe)/_layout.tsx` + `[recipeId].tsx` route. Run → PASS.

- [ ] **E4 — Gates + commit.** Run: `pnpm --filter @pantry/mobile lint && pnpm --filter @pantry/mobile typecheck && pnpm --filter @pantry/mobile test` — Expected: all green; components ≤300 LOC.

```bash
git add apps/mobile/src/app/(tabs)/index.tsx apps/mobile/src/app/(tabs)/cook.tsx apps/mobile/src/app/(recipe) apps/mobile/src/features/library apps/mobile/src/features/recipe-detail
git commit -m "feat(mobile): cook→library + Home←generation + NewAskSheet + recipe detail (board §03/§05/§07)"
```

---

# Slice F — Fidelity gate + e2e + decisions + roadmap status

**Files:** `docs/checklists/m5-library.md` (new), `docs/decisions.md`, `tools/design-fidelity/` capture scripts (extend the M4 pattern), `e2e/web/library.spec.ts`, `e2e/mobile/library.yaml`, roadmap Status table.

### The 5 frames to approve

| # | Frame | Reference (already committed) | Capture surface |
| - | ----- | ----------------------------- | --------------- |
| 1 | Web · Cook · empty | `cook-tab-library--web-cook-empty.png` | `/recipes` empty state (activeId `recipes` — logged divergence) |
| 2 | Web · Recipe detail | `inventory-recipe-detail--web-recipe-detail.png` | `/recipes/$id` with a seeded recipe fixture |
| 3 | Mobile · Cook · default | `cook-tab-library--mobile-cook-default.png` | Cook tab, populated library fixture |
| 4 | Mobile · Cook · new-tapped | `cook-tab-library--mobile-cook-new-tapped.png` | Cook tab with `NewAskSheet` open |
| 5 | Mobile · Recipe detail | `mobile-pantry-recipe--recipe-detail.png` | `/(recipe)/[id]` with a seeded fixture |

### Tasks

- [ ] **F1 — Web capture + compare.** Extend the M4 web capture script (`tools/design-fidelity/src/capture-m4-web.ts` is the template) to drive: sign in → seed recipes (insert via the API or a fixture loader) → `/recipes` (empty: capture before seeding; populated/detail: after) → `/recipes/$id`. Playwright 1280×860 → pixelmatch → iterate to faithful → record approval rows in `docs/checklists/m5-library.md` with mismatch % + a divergence note for the `recipes` nav highlight on frame 1 and the placeholder serves/cost/cal meta cells.

- [ ] **F2 — Mobile capture + compare.** Pinned simulator (status-bar override + frozen clock per M1–M4), `xcrun simctl io screenshot` for: Cook · default (seeded library), Cook · new-tapped (`NewAskSheet` open), Recipe detail. → pixelmatch → approve in the checklist. Note the deferred "recently cooked"/counts (decision C) and the resume banner being out of scope.

- [ ] **F3 — e2e.** Web `e2e/web/library.spec.ts`: sign in → generate a recipe (mock provider) → navigate to `/recipes` → assert the recipe appears → open it → assert detail renders → tap Save → reload → assert it shows as favorited (and appears under the Favorites filter). Mobile `e2e/mobile/library.yaml` (Maestro): Cook tab → tap a recipe card → detail → tap bookmark → back → "New" → `NewAskSheet` visible. Verify locally against Expo Go (CI execution deferred per M1–M4 precedent). Note results in the checklist.

- [ ] **F4 — Re-verify the relocated M4 frames.** Confirm "Mobile · Home" still matches `home--mobile-home*.png` now that it renders on the **Home tab** (composition unchanged — quick visual re-check, note in the checklist). Confirm the M4 web Home at `/cook` is untouched.

- [ ] **F5 — Decisions + status.** Append to `docs/decisions.md` (newest first), a "## 2026-06-15 — M5 scope decisions" block covering (A) Cook→library / prompt→Home relocation + the `recipes`-vs-`cook` nav-highlight divergence on the web empty frame; (B) favorites as a join table, `recipeSchema` untouched, `recipeDetailSchema` added; (C) recent/recently-cooked/counts deferred to M6 (rendered from persisted recipes as "recently generated"); (D) Start cooking/Share/Print stubbed, Save/favorite now live; (E) library list fields derived from `data` jsonb + serves/cost/cal as board-placeholder meta. Mark **M5 done** in the roadmap Status table and link this plan + `docs/checklists/m5-library.md`. Final sweep: `podman compose -f infra/podman/compose.yaml up -d && pnpm lint && pnpm typecheck && pnpm test && pnpm -r build`. Commit `docs: M5 complete; decisions logged; roadmap status updated`.

---

## Verification (end-to-end)

1. **Unit/contract:** `pnpm test` green — contracts (`library.test.ts`: filters, list query defaults, list item, detail DTO, favorites/byId inputs); API integration (`recipes-library`: per-user scoping, newest-first, idempotent favorites, favorites filter, `byId` 404 across users, UNAUTHORIZED on all three); web `useFavorite` + `RecipeLibraryScreen` + `RecipeDetailScreen` tests; mobile `useFavorite` + `RecipeLibraryScreen` + `NewAskSheet` tests.
2. **Types & lint:** `pnpm typecheck` (0 errors, all workspaces) + `pnpm lint` (`--max-warnings 0`, no `eslint-disable`/`any`). Every new component ≤300 (target 200) LOC; route files composition-only; favorite state in a hook, never inline.
3. **Build:** `pnpm -r build` succeeds.
4. **DB:** `db:migrate` applies `0004_*` on a fresh DB; `recipe_favorites` present with the composite PK + cascading FKs; no change to `recipes`/`recipe_generation_jobs`.
5. **Data flow:** a recipe generated via M4 appears in `/recipes` and the mobile Cook tab; opening it shows the full detail; favoriting it persists across reload and surfaces under the Favorites filter; a second user cannot read or favorite it (`NOT_FOUND`).
6. **Fidelity:** all 5 §03/§05/§07 frames approved in `docs/checklists/m5-library.md` (web Cook-empty approved with the logged `recipes` nav-highlight divergence; placeholder meta cells noted); relocated M4 "Mobile · Home" re-verified on the Home tab.
7. **E2E:** web `library.spec.ts` green (generate → library → detail → favorite → persists); mobile Maestro `library.yaml` verified locally; existing M1–M4 e2e still green.
8. **Manual smoke:** `podman compose up` → generate a recipe → it lands in the library on both web and device → open detail → "Start cooking" is an inert stub (M6) → bookmark toggles and persists → "Cook something new" / `NewAskSheet` returns to the generate flow.

## Self-review notes

- **Spec coverage:** every M5 roadmap bullet mapped — "Library queries + favorites" → Slices A–C (`recipes.list`/`byId`/`setFavorite` + `recipe_favorites`); "Web Cook·empty + Recipe detail" → Slice D; "Mobile Cook·default, New-tapped (NewAskSheet), Recipe detail incl. inline pantry block (frame ★-1)" → Slice E (the `IngredientBlock` is that inline pantry block); "~6 frames matched" → the **5** named M5 frames in Slice F (the board's 6th cook-library frame, `mobile-cook-with-resume`, is M6-gated and explicitly excluded); "e2e generate→library→detail→favorite" → Slice F3.
- **No new persistence of recipe bodies:** M5 reads the M4-persisted `recipes` rows; the only new table is the `recipe_favorites` join — consistent with M4 decision (b).
- **IA collision resolved + logged:** the Cook-vs-Home / library-vs-prompt tension (board says Cook = library; M4 put the prompt on Cook) is settled per platform — web hosts the library under its dedicated Recipes nav (no M4 churn), mobile relocates the prompt to the Home tab (the tab-bar has no Recipes slot). Decision (A), to be recorded in `docs/decisions.md`.
- **Reuses M4 vocabulary:** `recipeFormat.ts` (ingredient formatting + provenance tags), `WeirdnessControl`, suggestion chips, and the canonical `BottomSheet` — no duplicated recipe-rendering logic.
- **Deferred to later milestones (intentionally):** cook sessions / resume banner / "recently cooked" real data / "Start cooking" wiring (M6); recipe chat entry from detail (M7); entitlement gating on library size (M8). The Tonight/Cooked/Want-to-try filters render disabled until their M6 data exists.
- **No new suppressions:** zero `eslint-disable`/`any`/`@ts-expect-error`; `recipeSchema` left immutable so the M4 `done` re-emit is unaffected; detail uses a separate `recipeDetailSchema`.
