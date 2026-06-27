import { useRouter } from 'expo-router';
import { AccountScreen } from '../../features/account/components/AccountScreen';
import { useSubscription } from '../../features/billing/useSubscription';
import { authClient } from '../../lib/auth-client';

export default function Screen() {
  const session = authClient.useSession();
  const router = useRouter();
  const { subscription } = useSubscription();
  const name = session.data?.user.name ?? '';
  const email = session.data?.user.email ?? '';
  return (
    <AccountScreen
      user={{ name, email }}
      subscription={subscription ?? undefined}
      onUpgrade={() => {
        router.push('/(billing)/paywall');
      }}
      onManage={() => {
        router.push('/(billing)/manage');
      }}
      onEditDiet={() => {
        router.push('/settings/diet');
      }}
    />
  );
}
