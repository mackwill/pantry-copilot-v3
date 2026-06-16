import RNEventSourceLib from 'react-native-sse';

/** The slice of a react-native-sse event the tRPC SSE consumer reads. */
interface SseEvent {
  data?: string | null;
  lastEventId?: string | null;
}
type SseListener = (event: SseEvent) => void;

/** react-native-sse's public types are over-generic for our use; this is the
 *  minimal runtime surface the adapter drives. */
interface RNInstance {
  addEventListener(type: string, listener: SseListener): void;
  removeEventListener(type: string, listener: SseListener): void;
  close(): void;
}
interface RNOptions {
  headers?: Record<string, string>;
  withCredentials?: boolean;
  pollingInterval?: number;
}
interface RNConstructor {
  new (url: string, options?: RNOptions): RNInstance;
}

const RN = RNEventSourceLib as unknown as RNConstructor;

export type HeadersFn = () => Record<string, string>;

/** Init dict tRPC passes through (`eventSourceOptions`). */
export interface TrpcEventSourceInit {
  withCredentials?: boolean;
}

/** The `EventSourceLike.Instance` shape tRPC's httpSubscriptionLink requires. */
export interface TrpcEventSource {
  readonly CONNECTING: number;
  readonly OPEN: number;
  readonly CLOSED: number;
  readyState: number;
  addEventListener(type: string, listener: SseListener): void;
  removeEventListener(type: string, listener: SseListener): void;
  close(): void;
}

export interface TrpcEventSourceConstructor {
  new (url: string, init?: TrpcEventSourceInit): TrpcEventSource;
}

/**
 * Adapts `react-native-sse` to the `EventSource` ponyfill contract tRPC's
 * `httpSubscriptionLink` expects (React Native's `fetch` cannot stream).
 *
 * Two RN-specific concerns are handled here, closed over per client:
 * - **Auth:** RN has no cookie jar, so the better-auth session cookie is
 *   injected as a request header (the browser relies on `withCredentials`).
 * - **Reconnect:** the library's polling reconnect is disabled
 *   (`pollingInterval: 0`) so tRPC owns reconnection, matching the web link.
 */
export function createRNEventSource(getHeaders: HeadersFn): TrpcEventSourceConstructor {
  return class RNEventSourceAdapter implements TrpcEventSource {
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSED = 2;
    readyState = 0;
    private readonly inner: RNInstance;

    constructor(url: string, init?: TrpcEventSourceInit) {
      this.inner = new RN(url, {
        headers: getHeaders(),
        withCredentials: init?.withCredentials ?? false,
        pollingInterval: 0,
      });
      this.inner.addEventListener('open', () => {
        this.readyState = this.OPEN;
      });
      this.inner.addEventListener('error', () => {
        this.readyState = this.CLOSED;
      });
      this.inner.addEventListener('close', () => {
        this.readyState = this.CLOSED;
      });
    }

    addEventListener(type: string, listener: SseListener): void {
      this.inner.addEventListener(type, listener);
    }

    removeEventListener(type: string, listener: SseListener): void {
      this.inner.removeEventListener(type, listener);
    }

    close(): void {
      this.readyState = this.CLOSED;
      this.inner.close();
    }
  };
}
