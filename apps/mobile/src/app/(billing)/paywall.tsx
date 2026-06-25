import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaywallA } from '../../features/billing/components/PaywallA';
import { PaywallB } from '../../features/billing/components/PaywallB';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ variant?: string }>();
  const variant = firstParam(params.variant);

  const onDismiss = (): void => {
    router.back();
  };
  const onPurchased = (): void => {
    router.back();
  };

  if (variant === 'compare') {
    return <PaywallB onDismiss={onDismiss} onPurchased={onPurchased} />;
  }
  return <PaywallA onDismiss={onDismiss} onPurchased={onPurchased} />;
}
