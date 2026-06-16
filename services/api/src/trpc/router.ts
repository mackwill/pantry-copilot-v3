import { router } from './init.js';
import { cookRouter } from './routers/cook.js';
import { userRouter } from './routers/user.js';
import { pantryRouter } from './routers/pantry.js';
import { recipesRouter } from './routers/recipes.js';
import { scanRouter } from './routers/scan.js';

export const appRouter = router({ user: userRouter, pantry: pantryRouter, scan: scanRouter, recipes: recipesRouter, cook: cookRouter });
export type AppRouter = typeof appRouter;
