import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { type ApiClientOptions, createApiClient } from './index.js';

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

  it('exposes the generation subscription', () => {
    const client = createApiClient({ url: 'http://localhost:4000/trpc' });
    expectTypeOf(client.recipes.generateStream.subscribe).toBeFunction();
  });

  it('routes subscriptions through the injected EventSource, not fetch', async () => {
    const constructed: string[] = [];
    class FakeEventSource extends EventTarget {
      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSED = 2;
      readyState = 0;
      url: string;
      constructor(url: string | URL) {
        super();
        this.url = String(url);
        constructed.push(this.url);
      }
      close(): void {
        this.readyState = 2;
      }
    }
    const fetchSpy = vi.fn(() => Promise.resolve(new Response('[]', { headers: { 'content-type': 'application/json' } })));
    const client = createApiClient({
      url: 'http://localhost:4000/trpc',
      fetch: fetchSpy,
      EventSource: FakeEventSource as unknown as ApiClientOptions['EventSource'],
    });
    const sub = client.recipes.generateStream.subscribe(
      { prompt: 'soup', weirdness: 20, pantryItemIds: [] },
      {},
    );
    await new Promise((r) => setTimeout(r, 10));
    sub.unsubscribe();
    expect(constructed.length).toBe(1);
    expect(constructed[0]).toContain('recipes.generateStream');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
