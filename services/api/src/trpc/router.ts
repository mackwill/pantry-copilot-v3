import { router } from './init.js';
import { userRouter } from './routers/user.js';
import { pantryRouter } from './routers/pantry.js';
import { scanRouter } from './routers/scan.js';

export const appRouter = router({ user: userRouter, pantry: pantryRouter, scan: scanRouter });
export type AppRouter = typeof appRouter;
