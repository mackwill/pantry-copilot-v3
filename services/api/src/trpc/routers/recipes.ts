import {
  type AIGenerationRequest,
  type AIPantryChip,
  type AITweakRequest,
  type AITweakTurn,
  type RecipeDetail,
  type RecipeListItem,
  type RecipeTweakTurn,
  generationRequestSchema,
  recipeByIdInputSchema,
  recipeListQuerySchema,
  recipeRevertInputSchema,
  recipeTweakRequestSchema,
  setFavoriteInputSchema,
} from '@pantry/contracts';
import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { pantryItems, recipeFavorites, recipeGenerationJobs, recipeTweaks, recipes } from '../../db/schema/index.js';
import { assertAiActionAllowed } from '../../modules/subscription/limits.js';
import { protectedProcedure, router } from '../init.js';

type RecipeRow = typeof recipes.$inferSelect;
type TweakRow = typeof recipeTweaks.$inferSelect;

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

function toDetail(row: RecipeRow, favorited: boolean, tweakCount: number): RecipeDetail {
  return {
    ...row.data,
    id: row.id,
    userId: row.userId,
    prompt: row.prompt,
    weirdness: row.weirdness,
    createdAt: row.createdAt.toISOString(),
    favorited,
    version: row.version,
    tweakCount,
  };
}

function toTweakTurn(row: TweakRow): RecipeTweakTurn {
  return {
    id: row.id,
    turn: row.turn,
    userMessage: row.userMessage,
    summary: row.aiSummary,
    changes: row.changes,
    createdAt: row.createdAt.toISOString(),
  };
}

function expiresInDays(bestBy: string | null): number | null {
  if (bestBy === null) return null;
  const ms = Date.parse(bestBy);
  if (Number.isNaN(ms)) return null;
  return Math.round((ms - Date.now()) / 86_400_000);
}

type JobStatus = 'streaming' | 'succeeded' | 'failed' | 'aborted';

export const recipesRouter = router({
  /**
   * Stream a recipe generation. Writes a job row, proxies the AI service's
   * SSE through the raw stream client, persists the recipe once on `done`
   * (re-emitting it with the real persisted id), and records the job's
   * terminal status. Unsubscribe → the generator's `finally` runs → job
   * marked `aborted`, no recipe written.
   */
  generateStream: protectedProcedure.input(generationRequestSchema).subscription(async function* ({ ctx, input, signal }) {
    const userId = ctx.session.user.id;

    const rows =
      input.pantryItemIds.length > 0
        ? await ctx.db
            .select()
            .from(pantryItems)
            .where(and(eq(pantryItems.userId, userId), inArray(pantryItems.id, input.pantryItemIds)))
        : [];
    const pantry: AIPantryChip[] = rows.map((r) => ({
      name: r.name,
      quantity: Number(r.quantity),
      unit: r.unit,
      expiresInDays: expiresInDays(r.bestBy),
    }));

    const aiReq: AIGenerationRequest = { prompt: input.prompt, weirdness: input.weirdness, pantry, mustInclude: [] };

    await assertAiActionAllowed(ctx.db, userId, 'recipe', ctx.env);

    const [job] = await ctx.db.insert(recipeGenerationJobs).values({ userId, request: input, status: 'streaming' }).returning();
    if (job === undefined) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

    let outcome: JobStatus = 'streaming';
    let recipeId: string | null = null;
    let errorMessage: string | null = null;
    const abortSignal = signal ?? new AbortController().signal;

    try {
      for await (const ev of ctx.aiStream.streamGeneration(aiReq, { requestId: ctx.requestId, signal: abortSignal })) {
        if (ev.type === 'done') {
          if (recipeId === null) {
            const [row] = await ctx.db
              .insert(recipes)
              .values({ userId, prompt: input.prompt, weirdness: input.weirdness, title: ev.recipe.title, summary: ev.recipe.summary, data: ev.recipe })
              .returning();
            if (row === undefined) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
            recipeId = row.id;
          }
          outcome = 'succeeded';
          yield { ...ev, recipeId };
        } else if (ev.type === 'error') {
          outcome = 'failed';
          errorMessage = ev.message;
          yield ev;
        } else {
          yield ev;
        }
      }
    } finally {
      if (outcome === 'streaming') outcome = 'aborted';
      await ctx.db
        .update(recipeGenerationJobs)
        .set({ status: outcome, recipeId, error: errorMessage })
        .where(eq(recipeGenerationJobs.id, job.id));
    }
  }),

  /**
   * The caller's recipe library, newest first. `favorites` filters to this
   * user's favorited rows; `recent` behaves identically to `all` in M5 (the
   * default order is already newest-first) — it exists so the UI's "Recent"
   * pill is data-backed without a behavior change until M6 sessions land.
   */
  list: protectedProcedure.input(recipeListQuerySchema).query(async ({ ctx, input }): Promise<RecipeListItem[]> => {
    const userId = ctx.session.user.id;
    const favRows = await ctx.db
      .select({ recipeId: recipeFavorites.recipeId })
      .from(recipeFavorites)
      .where(eq(recipeFavorites.userId, userId));
    const favIds = new Set(favRows.map((f) => f.recipeId));

    const rows = await ctx.db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt))
      .limit(input.limit);
    const filtered = input.filter === 'favorites' ? rows.filter((r) => favIds.has(r.id)) : rows;
    return filtered.map((r) => toListItem(r, favIds.has(r.id)));
  }),

  byId: protectedProcedure.input(recipeByIdInputSchema).query(async ({ ctx, input }): Promise<RecipeDetail> => {
    const userId = ctx.session.user.id;
    const [row] = await ctx.db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)));
    if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
    const [fav] = await ctx.db
      .select()
      .from(recipeFavorites)
      .where(and(eq(recipeFavorites.userId, userId), eq(recipeFavorites.recipeId, row.id)));
    const [tally] = await ctx.db
      .select({ value: count() })
      .from(recipeTweaks)
      .where(eq(recipeTweaks.recipeId, row.id));
    return toDetail(row, fav !== undefined, tally?.value ?? 0);
  }),

  /**
   * Stream a tweak turn against a saved recipe (the recipe co-pilot). Loads
   * the own recipe, replays prior turns for context, proxies the AI service's
   * tweak SSE, and on `tweak_done` applies it in a transaction: bump
   * `version`, overwrite `data`/title/summary, capture `originalSnapshot` on
   * the first tweak, and append the turn row. Re-emits `tweak_done` with the
   * persisted ids. Unsubscribe before `done` → nothing persists. The tweak
   * rows are the audit log, so the `finally` writes nothing.
   */
  tweakStream: protectedProcedure.input(recipeTweakRequestSchema).subscription(async function* ({ ctx, input, signal }) {
    const userId = ctx.session.user.id;
    const [row] = await ctx.db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)));
    if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });

    const priorRows = await ctx.db
      .select()
      .from(recipeTweaks)
      .where(eq(recipeTweaks.recipeId, row.id))
      .orderBy(asc(recipeTweaks.turn));
    const priorTurns: AITweakTurn[] = priorRows.map((r) => ({
      userMessage: r.userMessage,
      summary: r.aiSummary,
      changes: r.changes,
    }));

    const aiReq: AITweakRequest = { recipe: row.data, prompt: input.prompt, priorTurns };
    const abortSignal = signal ?? new AbortController().signal;
    let applied = false;

    for await (const ev of ctx.aiStream.streamTweak(aiReq, { requestId: ctx.requestId, signal: abortSignal })) {
      if (ev.type === 'tweak_done' && !applied) {
        applied = true;
        const updated = ev.response.updatedRecipe;
        const nextTurn = priorRows.length + 1;
        const nextVersion = row.version + 1;
        await ctx.db.transaction(async (tx) => {
          await tx
            .update(recipes)
            .set({
              data: updated,
              title: updated.title,
              summary: updated.summary,
              version: nextVersion,
              ...(row.originalSnapshot === null ? { originalSnapshot: row.data } : {}),
            })
            .where(eq(recipes.id, row.id));
          await tx.insert(recipeTweaks).values({
            recipeId: row.id,
            userId,
            turn: nextTurn,
            userMessage: input.prompt,
            aiSummary: ev.response.summary,
            changes: ev.response.changes,
          });
        });
        yield { ...ev, recipeId: row.id, turn: nextTurn, version: nextVersion };
      } else {
        yield ev;
      }
    }
  }),

  /** The ordered tweak thread for a recipe (own-row), for chat hydration. */
  tweaks: protectedProcedure.input(recipeByIdInputSchema).query(async ({ ctx, input }): Promise<RecipeTweakTurn[]> => {
    const userId = ctx.session.user.id;
    const [owned] = await ctx.db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)));
    if (owned === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
    const rows = await ctx.db
      .select()
      .from(recipeTweaks)
      .where(eq(recipeTweaks.recipeId, input.recipeId))
      .orderBy(asc(recipeTweaks.turn));
    return rows.map(toTweakTurn);
  }),

  /**
   * Restore a recipe to its pre-tweak snapshot: reset `data`/title/summary,
   * set `version` back to 1, null the snapshot, and delete the tweak thread.
   * A no-op (returns current detail) when the recipe was never tweaked.
   */
  revert: protectedProcedure.input(recipeRevertInputSchema).mutation(async ({ ctx, input }): Promise<RecipeDetail> => {
    const userId = ctx.session.user.id;
    const [row] = await ctx.db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)));
    if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });

    if (row.originalSnapshot !== null) {
      const original = row.originalSnapshot;
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(recipes)
          .set({ data: original, title: original.title, summary: original.summary, version: 1, originalSnapshot: null })
          .where(eq(recipes.id, row.id));
        await tx.delete(recipeTweaks).where(eq(recipeTweaks.recipeId, row.id));
      });
    }

    const [fresh] = await ctx.db.select().from(recipes).where(eq(recipes.id, row.id));
    if (fresh === undefined) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    const [fav] = await ctx.db
      .select()
      .from(recipeFavorites)
      .where(and(eq(recipeFavorites.userId, userId), eq(recipeFavorites.recipeId, row.id)));
    return toDetail(fresh, fav !== undefined, 0);
  }),

  setFavorite: protectedProcedure
    .input(setFavoriteInputSchema)
    .mutation(async ({ ctx, input }): Promise<{ favorited: boolean }> => {
      const userId = ctx.session.user.id;
      const [owned] = await ctx.db
        .select({ id: recipes.id })
        .from(recipes)
        .where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)));
      if (owned === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
      if (input.favorited) {
        await ctx.db.insert(recipeFavorites).values({ userId, recipeId: input.recipeId }).onConflictDoNothing();
      } else {
        await ctx.db
          .delete(recipeFavorites)
          .where(and(eq(recipeFavorites.userId, userId), eq(recipeFavorites.recipeId, input.recipeId)));
      }
      return { favorited: input.favorited };
    }),
});
