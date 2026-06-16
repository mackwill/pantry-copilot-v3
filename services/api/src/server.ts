import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { sql } from 'drizzle-orm';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Pool } from 'pg';
import { registerDevMagicLink } from './auth/dev-magic-link.js';
import { createAuth, type Auth } from './auth/instance.js';
import { MagicLinkOutbox } from './auth/magic-link-outbox.js';
import { registerAuthRoutes } from './auth/routes.js';
import { createDb, type Db } from './db/client.js';
import { webOrigins, type Env } from './env.js';
import { type AiClient, createHttpAiClient } from './lib/ai-client.js';
import { type AiStreamClient, createHttpAiStreamClient } from './lib/ai-stream-client.js';
import { createContextFactory } from './trpc/context.js';
import { appRouter } from './trpc/router.js';

export interface AppDeps {
  env: Env;
  db: Db;
  pool: Pool;
  auth: Auth;
  outbox: MagicLinkOutbox;
  aiClient: AiClient;
  aiStream: AiStreamClient;
}

export function createDeps(env: Env, overrides: Partial<Pick<AppDeps, 'aiClient' | 'aiStream'>> = {}): AppDeps {
  const { db, pool } = createDb(env.DATABASE_URL);
  const outbox = new MagicLinkOutbox();
  const auth = createAuth({ env, db, outbox });
  const aiClient = overrides.aiClient ?? createHttpAiClient({ baseUrl: env.AI_SERVICE_URL, token: env.AI_SERVICE_TOKEN });
  const aiStream = overrides.aiStream ?? createHttpAiStreamClient({ baseUrl: env.AI_SERVICE_URL, token: env.AI_SERVICE_TOKEN });
  return { env, db, pool, auth, outbox, aiClient, aiStream };
}

export async function buildServer(deps: AppDeps): Promise<FastifyInstance> {
  const { env, db, pool, auth } = deps;
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    genReqId: (req) => {
      const header = req.headers['x-request-id'];
      return typeof header === 'string' && header.length > 0 ? header : randomUUID();
    },
  });

  app.addHook('onClose', async () => {
    await pool.end();
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
  });

  void app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: 60_000,
    allowList: (req) => req.url === '/health' || req.url === '/ready',
  });
  app.after(() => {
    app.setNotFoundHandler(
      { preHandler: app.rateLimit() },
      (_req, reply) => {
        reply.code(404).send({ message: 'Not Found' });
      },
    );
  });

  const allowed = new Set(webOrigins(env));
  await app.register(cors, {
    origin: (origin, cb) => {
      cb(null, origin === undefined || allowed.has(origin));
    },
    credentials: true,
    allowedHeaders: ['content-type', 'authorization', 'cookie', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
  });

  registerAuthRoutes(app, auth, { rateLimitMax: env.AUTH_RATE_LIMIT_MAX });

  if (env.AUTH_DEV_MAGIC_LINK) registerDevMagicLink(app, deps);

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: { router: appRouter, createContext: createContextFactory(deps) },
  });

  app.get('/health', () => ({ status: 'ok' }));

  app.get('/ready', async (_req, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: 'ready' };
    } catch (err) {
      app.log.error({ err }, 'readiness probe failed');
      reply.code(503);
      return { status: 'not_ready', reason: 'database_unreachable' };
    }
  });

  return app;
}
