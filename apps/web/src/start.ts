import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { securityHeaders } from './lib/security-headers';

// SSR runs server-side; the API origin for `connect-src` comes from the
// runtime env (set to the public/container API URL), falling back to local dev.
const resolveApiUrl = (): string =>
  (typeof process !== 'undefined' ? process.env['VITE_API_URL'] : undefined) ??
  'http://localhost:4000';

// Supplying a custom start instance replaces Start's built-in CSRF middleware,
// so re-add it — server functions (e.g. getSession) must stay CSRF-protected.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

const isDev = (): boolean =>
  typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'production';

// Attach strict CSP + companion headers to every document/SSR response.
const securityHeadersMiddleware = createMiddleware({ type: 'request' }).server(async ({ next }) => {
  const headers = securityHeaders({ apiUrl: resolveApiUrl(), dev: isDev() });
  for (const [name, value] of Object.entries(headers)) {
    setResponseHeader(name, value);
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, securityHeadersMiddleware],
}));
