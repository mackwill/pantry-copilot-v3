import { protectedProcedure, router } from '../init.js';

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
});
