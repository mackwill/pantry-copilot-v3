import { createApiClient, requestIdHeaders } from '@pantry/api-client';
import { authClient } from './auth-client';
import { env } from './env';
import { createRNEventSource } from './rn-event-source';

const authHeaders = (): Record<string, string> => ({
  cookie: authClient.getCookie(),
  ...requestIdHeaders(),
});

export const api = createApiClient({
  url: `${env.EXPO_PUBLIC_API_URL}/trpc`,
  headers: authHeaders,
  // RN fetch cannot stream SSE; inject the react-native-sse ponyfill (with the
  // session cookie, since RN has no cookie jar) for the subscription link.
  EventSource: createRNEventSource(authHeaders),
});
