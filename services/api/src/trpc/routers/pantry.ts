import { and, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createPantryItemInput, updatePantryItemInput, type PantryItem } from '@pantry/contracts';
import { z } from 'zod';
import { inventoryEvents, pantryItems } from '../../db/schema/index.js';
import { protectedProcedure, router } from '../init.js';

const toDto = (row: typeof pantryItems.$inferSelect): PantryItem => ({
  id: row.id,
  name: row.name,
  brand: row.brand,
  quantity: Number(row.quantity),
  unit: row.unit,
  category: row.category,
  location: row.location,
  purchasedAt: row.purchasedAt,
  bestBy: row.bestBy,
  notes: row.notes,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const pantryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.userId, ctx.session.user.id))
      .orderBy(desc(pantryItems.createdAt));
    return rows.map(toDto);
  }),
  create: protectedProcedure.input(createPantryItemInput).mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(pantryItems)
        .values({ userId: ctx.session.user.id, ...input, quantity: String(input.quantity) })
        .returning();
      if (row === undefined) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await tx.insert(inventoryEvents).values({
        itemId: row.id,
        userId: ctx.session.user.id,
        kind: 'added',
        quantityDelta: String(input.quantity),
      });
      return toDto(row);
    });
  }),
  update: protectedProcedure.input(updatePantryItemInput).mutation(async ({ ctx, input }) => {
    const { id, quantity, ...rest } = input;
    return ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .update(pantryItems)
        .set({ ...rest, ...(quantity === undefined ? {} : { quantity: String(quantity) }) })
        .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, ctx.session.user.id)))
        .returning();
      if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
      await tx.insert(inventoryEvents).values({
        itemId: id,
        userId: ctx.session.user.id,
        kind: 'edited',
        quantityDelta: '0',
      });
      return toDto(row);
    });
  }),
  remove: protectedProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(pantryItems)
        .where(and(eq(pantryItems.id, input.id), eq(pantryItems.userId, ctx.session.user.id)));
      if (row === undefined) throw new TRPCError({ code: 'NOT_FOUND' });
      await tx.delete(pantryItems).where(eq(pantryItems.id, input.id));
      return { id: input.id };
    });
  }),
});
