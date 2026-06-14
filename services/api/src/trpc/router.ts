import { router } from './init.js';
import { userRouter } from './routers/user.js';
import { pantryRouter } from './routers/pantry.js';

export const appRouter = router({ user: userRouter, pantry: pantryRouter });
export type AppRouter = typeof appRouter;
