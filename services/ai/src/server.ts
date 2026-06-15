import { randomUUID } from 'node:crypto';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Env } from './env.js';
import { buildProvider } from './providers/index.js';
import type { AIProvider } from './providers/types.js';
import { registerRecipeRoutes } from './routes/recipes.js';
import { registerScanRoutes } from './routes/scans.js';

export interface AppDeps {
  env: Env;
  provider: AIProvider;
}

export function createDeps(env: Env): AppDeps {
  return { env, provider: buildProvider(env) };
}

/** Base64 fridge photos are large; lift the 1MB default to ~20MB. */
const BODY_LIMIT_BYTES = 20 * 1024 * 1024;

export async function buildServer(deps: AppDeps): Promise<FastifyInstance> {
  const { env } = deps;
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
    bodyLimit: BODY_LIMIT_BYTES,
    genReqId: (req) => {
      const header = req.headers['x-request-id'];
      return typeof header === 'string' && header.length > 0 ? header : randomUUID();
    },
  });

  await app.register(helmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
  });

  const expectedAuth = `Bearer ${env.AI_SERVICE_TOKEN}`;
  app.addHook('onRequest', async (req, reply) => {
    reply.header('x-request-id', req.id);
    const guarded = req.url.startsWith('/scans') || req.url.startsWith('/recipes');
    if (guarded && req.headers.authorization !== expectedAuth) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  app.get('/health', () => ({ status: 'ok' }));

  registerScanRoutes(app, deps);
  registerRecipeRoutes(app, deps);

  return app;
}
