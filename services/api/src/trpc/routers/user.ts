import { updateUserPreferencesSchema, type UserPreferences } from '@pantry/contracts';
import { eq } from 'drizzle-orm';
import { userPreferences } from '../../db/schema/index.js';
import { protectedProcedure, router } from '../init.js';

const EMPTY_PREFERENCES: UserPreferences = { diet: [], allergies: [] };

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    const { user } = ctx.session;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.image ?? null,
    };
  }),

  preferences: protectedProcedure.query(async ({ ctx }): Promise<UserPreferences> => {
    const [row] = await ctx.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, ctx.session.user.id));
    if (row === undefined) return EMPTY_PREFERENCES;
    return { diet: row.diet, allergies: row.allergies };
  }),

  updatePreferences: protectedProcedure
    .input(updateUserPreferencesSchema)
    .mutation(async ({ ctx, input }): Promise<UserPreferences> => {
      const [row] = await ctx.db
        .insert(userPreferences)
        .values({ userId: ctx.session.user.id, diet: input.diet, allergies: input.allergies })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: { diet: input.diet, allergies: input.allergies, updatedAt: new Date() },
        })
        .returning();
      return row === undefined ? input : { diet: row.diet, allergies: row.allergies };
    }),
});
