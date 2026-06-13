// @better-auth/expo lazily import()s expo-network; pre-load it statically so
// the module lives in the main bundle (Expo Go can't fetch split segments).
import 'expo-network';
import { expoClient } from '@better-auth/expo/client';
import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { env } from './env';

export const authClient = createAuthClient({
  baseURL: `${env.EXPO_PUBLIC_API_URL}/api/auth`,
  plugins: [
    expoClient({ scheme: 'pantrycopilot', storagePrefix: 'pantry-copilot', storage: SecureStore }),
    magicLinkClient(),
  ],
});
