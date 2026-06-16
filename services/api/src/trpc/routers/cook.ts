import {
  type CookSession,
  abandonSessionInputSchema,
  advanceStepInputSchema,
  consumeInputSchema,
  startSessionInputSchema,
} from '@pantry/contracts';
import { deduct } from '@pantry/utils';
import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { cookSessions, inventoryEvents, pantryItems, recipes } from '../../db/schema/index.js';
import { protectedProcedure, router } from '../init.js';

type CookSessionRow = typeof cookSessions.$inferSelect;

function toDto(row: CookSessionRow, recipeTitle: string, totalSteps: number): CookSession {
  return {
    id: row.id,
    recipeId: row.recipeId,
    status: row.status,
    currentStepIndex: row.currentStepIndex,
    totalSteps,
    recipeTitle,
    startedAt: row.startedAt.toISOString(),
  };
}

export const cookRouter = router({
  /**
   * Begin cooking a library recipe. Enforces the single-active-session
   * invariant by abandoning any existing active session for the user, then
   * creates a fresh one at step 0. 404s if the recipe isn't the caller's.
   */
  start: protectedProcedure.input(startSessionInputSchema).mutation(async ({ ctx, input }): Promise<CookSession> => {
    const userId = ctx.session.user.id;
    return ctx.db.transaction(async (tx) => {
      const [recipe] = await tx
        .select()
        .from(recipes)
        .where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)));
      if (recipe === undefined) throw new TRPCError({ code: 'NOT_FOUND' });

      await tx
        .update(cookSessions)
        .set({ status: 'abandoned' })
        .where(and(eq(cookSessions.userId, userId), eq(cookSessions.status, 'active')));

      const [row] = await tx.insert(cookSessions).values({ userId, recipeId: recipe.id }).returning();
      if (row === undefined) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      return toDto(row, recipe.title, recipe.data.steps.length);
    });
  }),

  /** The user's resumable session, or null. Source for the §03 resume banner. */
  getActive: protectedProcedure.query(async ({ ctx }): Promise<CookSession | null> => {
    const userId = ctx.session.user.id;
    const [row] = await ctx.db
      .select()
      .from(cookSessions)
      .where(and(eq(cookSessions.userId, userId), eq(cookSessions.status, 'active')))
      .orderBy(desc(cookSessions.startedAt))
      .limit(1);
    if (row === undefined) return null;
    const [recipe] = await ctx.db.select().from(recipes).where(eq(recipes.id, row.recipeId));
    if (recipe === undefined) return null;
    return toDto(row, recipe.title, recipe.data.steps.length);
  }),

  /** Move the active session to a step (clamped to the recipe's step count). */
  advanceStep: protectedProcedure.input(advanceStepInputSchema).mutation(async ({ ctx, input }): Promise<CookSession> => {
    const userId = ctx.session.user.id;
    const [row] = await ctx.db
      .select()
      .from(cookSessions)
      .where(and(eq(cookSessions.id, input.sessionId), eq(cookSessions.userId, userId)));
    if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
    if (row.status !== 'active') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session is not active' });

    const [recipe] = await ctx.db.select().from(recipes).where(eq(recipes.id, row.recipeId));
    if (recipe === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
    const totalSteps = recipe.data.steps.length;
    const stepIndex = Math.min(input.stepIndex, totalSteps - 1);

    const [updated] = await ctx.db
      .update(cookSessions)
      .set({ currentStepIndex: stepIndex })
      .where(eq(cookSessions.id, row.id))
      .returning();
    if (updated === undefined) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    return toDto(updated, recipe.title, totalSteps);
  }),

  /** Drop the session without consuming (e.g. the user exits the stove screen). */
  abandon: protectedProcedure
    .input(abandonSessionInputSchema)
    .mutation(async ({ ctx, input }): Promise<{ status: 'abandoned' }> => {
      const userId = ctx.session.user.id;
      const [updated] = await ctx.db
        .update(cookSessions)
        .set({ status: 'abandoned' })
        .where(and(eq(cookSessions.id, input.sessionId), eq(cookSessions.userId, userId)))
        .returning();
      if (updated === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
      return { status: 'abandoned' };
    }),

  /**
   * Finish the cook and update the pantry — atomically. Per item: deduct the
   * used quantity, write a `consumed` inventory event, and either reduce the
   * stock or remove the item if it's used up. Then mark the session completed.
   */
  consume: protectedProcedure
    .input(consumeInputSchema)
    .mutation(async ({ ctx, input }): Promise<{ sessionId: string; itemsConsumed: number; itemsRemoved: number }> => {
      const userId = ctx.session.user.id;
      return ctx.db.transaction(async (tx) => {
        const [session] = await tx
          .select()
          .from(cookSessions)
          .where(and(eq(cookSessions.id, input.sessionId), eq(cookSessions.userId, userId)));
        if (session === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
        if (session.status !== 'active') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Session already finished' });

        let itemsRemoved = 0;
        for (const item of input.items) {
          const [pantryRow] = await tx
            .select()
            .from(pantryItems)
            .where(and(eq(pantryItems.id, item.pantryItemId), eq(pantryItems.userId, userId)));
          if (pantryRow === undefined) throw new TRPCError({ code: 'NOT_FOUND' });

          const { remaining, finished } = deduct(Number(pantryRow.quantity), item.quantityUsed);
          const removed = finished || item.finished;

          await tx.insert(inventoryEvents).values({
            itemId: pantryRow.id,
            userId,
            kind: 'consumed',
            quantityDelta: String(-item.quantityUsed),
          });

          if (removed) {
            await tx.delete(pantryItems).where(eq(pantryItems.id, pantryRow.id));
            itemsRemoved += 1;
          } else {
            await tx.update(pantryItems).set({ quantity: String(remaining) }).where(eq(pantryItems.id, pantryRow.id));
          }
        }

        await tx
          .update(cookSessions)
          .set({ status: 'completed', completedAt: new Date() })
          .where(eq(cookSessions.id, session.id));
        return { sessionId: session.id, itemsConsumed: input.items.length, itemsRemoved };
      });
    }),
});
