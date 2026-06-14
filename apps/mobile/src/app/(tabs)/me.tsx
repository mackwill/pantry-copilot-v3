import { authClient } from '../../lib/auth-client';
import { AccountScreen } from '../../features/account/components/AccountScreen';

export default function Screen() {
  const session = authClient.useSession();
  const name = session.data?.user.name ?? '';
  const email = session.data?.user.email ?? '';
  return <AccountScreen user={{ name, email }} />;
}
