import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { toWebHeaders } from '../auth/headers.js';
import type { AppDeps } from '../server.js';

export function createContextFactory(deps: AppDeps) {
  return async function createContext({ req }: CreateFastifyContextOptions) {
    const session = await deps.auth.api.getSession({
      headers: toWebHeaders(req.headers),
    });
    return { db: deps.db, session, aiClient: deps.aiClient, aiStream: deps.aiStream, requestId: req.id };
  };
}

export type Context = Awaited<ReturnType<ReturnType<typeof createContextFactory>>>;
