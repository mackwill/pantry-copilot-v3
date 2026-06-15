import { type AIGenerationRequest, type AIPantryChip, generationRequestSchema } from '@pantry/contracts';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { pantryItems, recipeGenerationJobs, recipes } from '../../db/schema/index.js';
import { protectedProcedure, router } from '../init.js';

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
});
