import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { consumeAiActionSlot } from './ai-rate-limit.js';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.session === null) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

/**
 * Generation/scan procedures call the AI provider and cost real money; give
 * them a tighter per-user/minute ceiling on top of the global rate limit.
 */
export const aiRateLimitedProcedure = protectedProcedure.use(({ ctx, next }) => {
  const allowed = consumeAiActionSlot(
    ctx.session.user.id,
    ctx.env.AI_ACTION_RATE_LIMIT_MAX,
    60_000,
    Date.now(),
  );
  if (!allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many AI requests. Please wait a moment.',
    });
  }
  return next();
});
