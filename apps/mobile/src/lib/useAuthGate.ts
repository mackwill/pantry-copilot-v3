import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { authClient } from './auth-client';

export function useAuthGate(): void {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (session === null && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session !== null && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isPending, session, segments, router]);
}
