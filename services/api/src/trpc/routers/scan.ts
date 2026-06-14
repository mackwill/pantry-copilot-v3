import { type PantryItem, aiImageExtractionRequestSchema, confirmScanInput } from '@pantry/contracts';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { imageScans, inventoryEvents, pantryItems } from '../../db/schema/index.js';
import { protectedProcedure, router } from '../init.js';

const toPantryDto = (row: typeof pantryItems.$inferSelect): PantryItem => ({
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

export const scanRouter = router({
  extract: protectedProcedure.input(aiImageExtractionRequestSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const [scan] = await ctx.db.insert(imageScans).values({ userId, status: 'processing' }).returning();
    if (scan === undefined) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

    try {
      const extraction = await ctx.aiClient.extractFromImage(input, { requestId: ctx.requestId });
      await ctx.db
        .update(imageScans)
        .set({
          status: 'succeeded',
          result: extraction.result,
          provider: extraction.provider,
          model: extraction.model,
          tokensInput: extraction.tokensUsed.input,
          tokensOutput: extraction.tokensUsed.output,
        })
        .where(eq(imageScans.id, scan.id));
      return { scanId: scan.id, result: extraction.result };
    } catch {
      await ctx.db.update(imageScans).set({ status: 'failed' }).where(eq(imageScans.id, scan.id));
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Image extraction failed' });
    }
  }),

  confirm: protectedProcedure.input(confirmScanInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return ctx.db.transaction(async (tx) => {
      const [scan] = await tx
        .select()
        .from(imageScans)
        .where(and(eq(imageScans.id, input.scanId), eq(imageScans.userId, userId)));
      if (scan === undefined) throw new TRPCError({ code: 'NOT_FOUND' });

      const created: PantryItem[] = [];
      for (const item of input.items) {
        const [row] = await tx
          .insert(pantryItems)
          .values({ userId, ...item, quantity: String(item.quantity) })
          .returning();
        if (row === undefined) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await tx.insert(inventoryEvents).values({
          itemId: row.id,
          userId,
          kind: 'added',
          quantityDelta: String(item.quantity),
        });
        created.push(toPantryDto(row));
      }

      await tx.update(imageScans).set({ status: 'confirmed' }).where(eq(imageScans.id, scan.id));
      return created;
    });
  }),
});
