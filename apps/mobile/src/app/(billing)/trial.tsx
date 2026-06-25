import { useLocalSearchParams, useRouter } from 'expo-router';
import { TrialEnding } from '../../features/billing/components/TrialEnding';
import { TrialOffer } from '../../features/billing/components/TrialOffer';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ variant?: string }>();
  const variant = firstParam(params.variant);

  const onPurchased = (): void => {
    router.back();
  };
  const goBack = (): void => {
    router.back();
  };

  if (variant === 'offer') {
    return (
      <TrialOffer
        onPurchased={onPurchased}
        onSeePlans={() => {
          router.push('/(billing)/paywall?variant=compare');
        }}
      />
    );
  }
  return <TrialEnding onBack={goBack} onCancel={goBack} onPurchased={onPurchased} />;
}
