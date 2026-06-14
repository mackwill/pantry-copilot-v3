import { randomUUID } from 'node:crypto';
import helmet from '@fastify/helmet';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Env } from './env.js';
import type { AIProvider } from './providers/types.js';

export interface AppDeps {
  env: Env;
  provider: AIProvider;
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
    if (req.url.startsWith('/scans') && req.headers.authorization !== expectedAuth) {
      return reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  app.get('/health', () => ({ status: 'ok' }));

  return app;
}
