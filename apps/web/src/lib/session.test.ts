import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSession } from './session';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('getSession (browser path)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed session when the api answers with a user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ user: { id: 'u1', email: 'mara@example.com', name: 'Mara' } }),
        ),
      ),
    );
    const session = await getSession();
    expect(session?.user.email).toBe('mara@example.com');
  });

  it('returns null when the api answers null (no session)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(null))));
    expect(await getSession()).toBeNull();
  });

  it('returns null on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({}, 503))));
    expect(await getSession()).toBeNull();
  });

  it('sends credentials so the session cookie travels', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(jsonResponse(null)));
    vi.stubGlobal('fetch', fetchSpy);
    await getSession();
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/get-session',
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
