import { useRouter } from 'expo-router';
import { ManageSubscription } from '../../features/billing/components/ManageSubscription';
import { useBilling } from '../../features/billing/useBilling';
import { useSubscription } from '../../features/billing/useSubscription';

const EMPTY_PRO = {
  tier: 'pro',
  isPro: true,
  subState: 'active',
  expiresAt: null,
  willRenew: true,
  productIdentifier: null,
  periodType: 'normal',
  store: null,
  topUpCredits: 0,
  inGracePeriod: false,
} as const;

export default function Screen() {
  const router = useRouter();
  const { subscription } = useSubscription();
  const billing = useBilling({
    onRestored: () => {
      router.back();
    },
  });
  const busy = billing.status === 'restoring' || billing.status === 'purchasing';

  const changePlan = (): void => {
    router.push('/(billing)/paywall?variant=compare');
  };

  return (
    <ManageSubscription
      subscription={subscription ?? EMPTY_PRO}
      onBack={() => {
        router.back();
      }}
      onChangePlan={changePlan}
      onCancel={changePlan}
      onRestore={() => {
        void billing.restore();
      }}
      busy={busy}
    />
  );
}
