/**
 * Strict CSP + companion headers for every web document response.
 * `connect-src` must include the API origin (tRPC XHR + SSE EventSource).
 * `style-src 'unsafe-inline'` is required because the design system ships
 * tokens/styles inline via CSS Modules hydration; scripts stay strict.
 */
export function securityHeaders(opts: { apiUrl: string }): Record<string, string> {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    `connect-src 'self' ${opts.apiUrl}`,
  ].join('; ');
  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=15552000; includeSubDomains',
  };
}
