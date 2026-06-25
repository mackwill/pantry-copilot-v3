/**
 * Strict CSP + companion headers for every web document response.
 * `connect-src` must include the API origin (tRPC XHR + SSE EventSource).
 * `style-src 'unsafe-inline'` is required because the design system ships
 * tokens/styles inline via CSS Modules hydration; scripts stay strict.
 *
 * In `dev`, Vite serves inline/eval HMR scripts and a websocket — strict
 * `script-src 'self'` would block hydration — so loosen scripts + connect
 * for the dev server only; production stays locked down.
 */
export function securityHeaders(opts: { apiUrl: string; dev?: boolean }): Record<string, string> {
  const scriptSrc = opts.dev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'";
  const connectSrc = opts.dev
    ? `connect-src 'self' ${opts.apiUrl} ws: wss:`
    : `connect-src 'self' ${opts.apiUrl}`;
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    connectSrc,
  ].join('; ');
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  };
}
