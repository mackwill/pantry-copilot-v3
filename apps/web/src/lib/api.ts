import { createApiClient } from '@pantry/api-client';
import { env } from './env';

export const api = createApiClient({
  url: `${env.VITE_API_URL}/trpc`,
  fetch: (input, init) => fetch(input, { ...init, credentials: 'include' }),
});
