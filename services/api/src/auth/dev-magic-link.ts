import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppDeps } from '../server.js';

const bodySchema = z.object({ email: z.email() });

/** Dev/e2e session bootstrap. Registered only when AUTH_DEV_MAGIC_LINK=true;
 *  the env schema rejects that flag in production. */
export function registerDevMagicLink(app: FastifyInstance, deps: AppDeps): void {
  app.post('/api/dev/magic-link', async (request, reply) => {
    const { email } = bodySchema.parse(request.body);
    await deps.auth.api.signInMagicLink({
      body: { email, callbackURL: '/' },
      headers: new Headers(),
    });
    const message = deps.outbox.takeLast();
    if (message === undefined) {
      reply.code(500);
      return { error: 'magic link was not captured' };
    }
    return { url: message.url };
  });
}
