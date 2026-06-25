import interVariable from '@pantry/design-system/fonts/Inter-Variable.woff2';
import jetbrainsMonoVariable from '@pantry/design-system/fonts/JetBrainsMono-Variable.woff2';
import newsreaderItalic from '@pantry/design-system/fonts/Newsreader-Italic.woff2';
import newsreaderVariable from '@pantry/design-system/fonts/Newsreader-Variable.woff2';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { purchases } from '../features/billing/purchases';
import { authClient } from '../lib/auth-client';
import { useAuthGate } from '../lib/useAuthGate';

/**
 * Configure RevenueCat once and identify the authed user. Guarded end-to-end:
 * `purchases.configure`/`logIn` are no-ops in Expo Go (no dev build) or when no
 * platform RC key is set, so this never throws and never blocks the font/auth gate.
 */
function useBillingBootstrap(): void {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;

  useEffect(() => {
    void purchases.configure();
  }, []);

  useEffect(() => {
    if (userId === undefined) return;
    void purchases.logIn(userId);
  }, [userId]);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Newsreader: newsreaderVariable,
    'Newsreader-Italic': newsreaderItalic,
    Inter: interVariable,
    'JetBrains Mono': jetbrainsMonoVariable,
  });
  useAuthGate();
  useBillingBootstrap();
  if (fontError) throw fontError;
  if (!fontsLoaded) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
