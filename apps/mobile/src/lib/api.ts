import { createApiClient } from '@pantry/api-client';
import { authClient } from './auth-client';
import { env } from './env';

export const api = createApiClient({
  url: `${env.EXPO_PUBLIC_API_URL}/trpc`,
  headers: () => ({ cookie: authClient.getCookie() }),
});
