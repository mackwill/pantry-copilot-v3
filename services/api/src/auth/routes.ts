import type { FastifyInstance } from 'fastify';
import { toWebHeaders } from './headers.js';
import type { Auth } from './instance.js';

export function registerAuthRoutes(
  app: FastifyInstance,
  auth: Auth,
  opts: { rateLimitMax: number },
): void {
  app.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    config: { rateLimit: { max: opts.rateLimitMax, timeWindow: 60_000 } },
    async handler(request, reply) {
      const url = new URL(
        request.url,
        `${request.protocol}://${request.headers.host ?? 'localhost'}`,
      );
      const headers = toWebHeaders(request.headers);
      const init: RequestInit = { method: request.method, headers };
      if (request.method !== 'GET' && request.body !== undefined && request.body !== null) {
        init.body =
          typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
      }
      const response = await auth.handler(new Request(url.toString(), init));
      reply.status(response.status);
      const setCookies = response.headers.getSetCookie();
      if (setCookies.length > 0) reply.header('set-cookie', setCookies);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') return;
        reply.header(key, value);
      });
      reply.send(await response.text());
    },
  });
}
