import { createApiClient, requestIdHeaders } from '@pantry/api-client';
import { env } from './env';

export const api = createApiClient({
  url: `${env.VITE_API_URL}/trpc`,
  headers: requestIdHeaders,
  fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
});
