import { ProfileEditScreen } from '../../features/account/components/ProfileEditScreen';
import { authClient } from '../../lib/auth-client';

export default function Screen() {
  const session = authClient.useSession();
  return (
    <ProfileEditScreen name={session.data?.user.name ?? ''} email={session.data?.user.email ?? ''} />
  );
}
