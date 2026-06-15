import type { AppRouter } from '@pantry/api/router';
import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink, type TRPCClient } from '@trpc/client';
import superjson from 'superjson';

type SubscriptionLinkOptions = Parameters<typeof httpSubscriptionLink>[0];

export interface ApiClientOptions {
  url: string;
  fetch?: typeof globalThis.fetch;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
  /**
   * EventSource ponyfill for the subscription link. The browser's native
   * `EventSource` is used when omitted; React Native must inject one
   * (its `fetch` cannot stream), e.g. `react-native-sse`.
   */
  EventSource?: SubscriptionLinkOptions['EventSource'];
}

type FetchEsque = NonNullable<Parameters<typeof httpBatchLink>[0]['fetch']>;

/** tRPC's RequestInitEsque types signal as `AbortSignal | undefined`, which
 *  exactOptionalPropertyTypes rejects against RequestInit's `AbortSignal | null`. */
function toFetchEsque(fetchImpl: typeof globalThis.fetch): FetchEsque {
  return (input, init) =>
    fetchImpl(input, init === undefined ? undefined : { ...init, signal: init.signal ?? null });
}

/**
 * One typed tRPC client for the whole app. `splitLink` routes subscriptions
 * (recipe generation) through `httpSubscriptionLink` (SSE) and everything
 * else through the batched HTTP link — both with the superjson transformer.
 */
export function createApiClient(opts: ApiClientOptions): TRPCClient<AppRouter> {
  return createTRPCClient<AppRouter>({
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: httpSubscriptionLink({
          url: opts.url,
          transformer: superjson,
          // The browser EventSource is cross-origin (web ↔ api); without
          // withCredentials it omits the session cookie and every subscription
          // 401s. The API's CORS allows credentials for the configured origins.
          eventSourceOptions: { withCredentials: true },
          ...(opts.EventSource === undefined ? {} : { EventSource: opts.EventSource }),
        }),
        false: httpBatchLink({
          url: opts.url,
          transformer: superjson,
          ...(opts.fetch === undefined ? {} : { fetch: toFetchEsque(opts.fetch) }),
          ...(opts.headers === undefined ? {} : { headers: opts.headers }),
        }),
      }),
    ],
  });
}

export type { AppRouter };
