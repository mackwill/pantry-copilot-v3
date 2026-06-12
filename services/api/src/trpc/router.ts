import { router } from './init.js';
import { userRouter } from './routers/user.js';

export const appRouter = router({ user: userRouter });
export type AppRouter = typeof appRouter;
