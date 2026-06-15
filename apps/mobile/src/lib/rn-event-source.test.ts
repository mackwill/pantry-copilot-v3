import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Captured constructor calls + per-instance listeners for the mocked library. */
interface FakeInstance {
  url: string;
  options: Record<string, unknown>;
  listeners: Map<string, (event: unknown) => void>;
  closed: boolean;
}

const instances: FakeInstance[] = [];

vi.mock('react-native-sse', () => {
  class FakeEventSource {
    readonly url: string;
    readonly options: Record<string, unknown>;
    readonly listeners = new Map<string, (event: unknown) => void>();
    closed = false;

    constructor(url: string, options?: Record<string, unknown>) {
      this.url = url;
      this.options = options ?? {};
      instances.push(this);
    }

    addEventListener(type: string, listener: (event: unknown) => void): void {
      this.listeners.set(type, listener);
    }

    removeEventListener(type: string): void {
      this.listeners.delete(type);
    }

    close(): void {
      this.closed = true;
    }
  }
  return { default: FakeEventSource };
});

const { createRNEventSource } = await import('./rn-event-source');

function emit(instance: FakeInstance, type: string, event: unknown): void {
  instance.listeners.get(type)?.(event);
}

describe('createRNEventSource', () => {
  beforeEach(() => {
    instances.length = 0;
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('injects auth headers and disables the library reconnect poll', () => {
    const Ctor = createRNEventSource(() => ({ cookie: 'session=abc' }));
    new Ctor('https://api.test/trpc/recipes.generateStream', { withCredentials: true });

    const inner = instances[0];
    expect(inner.url).toBe('https://api.test/trpc/recipes.generateStream');
    expect(inner.options['headers']).toEqual({ cookie: 'session=abc' });
    expect(inner.options['withCredentials']).toBe(true);
    expect(inner.options['pollingInterval']).toBe(0);
  });

  it('exposes the tRPC EventSourceLike state constants', () => {
    const Ctor = createRNEventSource(() => ({}));
    const es = new Ctor('https://api.test', {});
    expect(es.CONNECTING).toBe(0);
    expect(es.OPEN).toBe(1);
    expect(es.CLOSED).toBe(2);
    expect(es.readyState).toBe(es.CONNECTING);
  });

  it('tracks readyState across open → error and close()', () => {
    const Ctor = createRNEventSource(() => ({}));
    const es = new Ctor('https://api.test', {});
    const inner = instances[0];

    emit(inner, 'open', { type: 'open' });
    expect(es.readyState).toBe(es.OPEN);

    emit(inner, 'error', { type: 'error' });
    expect(es.readyState).toBe(es.CLOSED);

    es.close();
    expect(inner.closed).toBe(true);
    expect(es.readyState).toBe(es.CLOSED);
  });

  it('forwards addEventListener/removeEventListener to the inner source', () => {
    const Ctor = createRNEventSource(() => ({}));
    const es = new Ctor('https://api.test', {});
    const inner = instances[0];

    const received: unknown[] = [];
    const listener = (event: { data?: unknown }): void => {
      received.push(event.data);
    };
    es.addEventListener('message', listener);
    emit(inner, 'message', { data: '{"hello":1}', lastEventId: '7' });
    expect(received).toEqual(['{"hello":1}']);

    es.removeEventListener('message', listener);
    expect(inner.listeners.has('message')).toBe(false);
  });
});
