import type { FastifyInstance } from 'fastify';

export function signUp(
  app: FastifyInstance,
  creds: { name: string; email: string; password: string },
) {
  return app.inject({ method: 'POST', url: '/api/auth/sign-up/email', payload: creds });
}
