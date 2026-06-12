import type { AppRouter } from '@pantry/api/router';
import { createTRPCClient, httpBatchLink, type TRPCClient } from '@trpc/client';
import superjson from 'superjson';

export interface ApiClientOptions {
  url: string;
  fetch?: typeof globalThis.fetch;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
}

type FetchEsque = NonNullable<Parameters<typeof httpBatchLink>[0]['fetch']>;

/** tRPC's RequestInitEsque types signal as `AbortSignal | undefined`, which
 *  exactOptionalPropertyTypes rejects against RequestInit's `AbortSignal | null`. */
function toFetchEsque(fetchImpl: typeof globalThis.fetch): FetchEsque {
  return (input, init) =>
    fetchImpl(input, init === undefined ? undefined : { ...init, signal: init.signal ?? null });
}

export function createApiClient(opts: ApiClientOptions): TRPCClient<AppRouter> {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: opts.url,
        transformer: superjson,
        ...(opts.fetch === undefined ? {} : { fetch: toFetchEsque(opts.fetch) }),
        ...(opts.headers === undefined ? {} : { headers: opts.headers }),
      }),
    ],
  });
}

export type { AppRouter };
