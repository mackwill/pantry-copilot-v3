import { describe, expect, it } from 'vitest';
import { securityHeaders } from './security-headers';

describe('securityHeaders', () => {
  const h = securityHeaders({ apiUrl: 'https://api.pantrycopilot.app' });

  it('locks default-src to self and disallows framing', () => {
    expect(h['Content-Security-Policy']).toContain("default-src 'self'");
    expect(h['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(h['X-Frame-Options']).toBe('DENY');
  });

  it('allows the API origin for connect-src (xhr + SSE)', () => {
    expect(h['Content-Security-Policy']).toContain('connect-src');
    expect(h['Content-Security-Policy']).toContain('https://api.pantrycopilot.app');
  });

  it('sets nosniff, referrer, and HSTS', () => {
    expect(h['X-Content-Type-Options']).toBe('nosniff');
    expect(h['Referrer-Policy']).toBe('no-referrer');
    expect(h['Strict-Transport-Security']).toContain('max-age=');
  });
});
