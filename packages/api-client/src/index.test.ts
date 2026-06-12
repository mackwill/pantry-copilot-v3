import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createApiClient } from './index.js';

describe('createApiClient', () => {
  it('exposes a typed user.me', () => {
    const client = createApiClient({ url: 'http://localhost:4000/trpc' });
    expectTypeOf(client.user.me.query).toBeFunction();
  });

  it('routes requests through the provided fetch', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ result: { data: { json: null } } }]), {
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const client = createApiClient({ url: 'http://localhost:4000/trpc', fetch: fetchSpy });
    await client.user.me.query().catch(() => undefined);
    expect(fetchSpy).toHaveBeenCalled();
  });
});
