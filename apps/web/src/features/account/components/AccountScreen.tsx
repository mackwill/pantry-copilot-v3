import { Button, Icon, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { authClient } from '../../../lib/auth-client';
import { useShellNav, webShellUser } from '../../pantry-shared/nav';
import { accountStrings as s } from '../strings';
import styles from '../account.module.css';
import { AccountSidebar } from './AccountSidebar';
import { PreferencesCard } from './PreferencesCard';
import { ProfileCard } from './ProfileCard';
import { StatsCard } from './StatsCard';

export interface AccountScreenUser {
  name: string;
  email: string;
}

interface AccountScreenProps {
  user: AccountScreenUser;
}

export function AccountScreen({ user }: AccountScreenProps) {
  const navigate = useNavigate();
  const shellNav = useShellNav();

  const handleSignOut = () => {
    void authClient.signOut().then(() => {
      void navigate({ to: '/login' });
    });
  };

  return (
    <WebShell {...shellNav} user={webShellUser(user)} hideTopbar>
      <div className={styles['topBar']}>
        <Button
          kind="ghost"
          size="sm"
          leftIcon={<Icon name="ChevronLeft" size={16} />}
          onClick={() => { history.back(); }}
        >
          {s.back}
        </Button>
      </div>
      <div className={styles['grid']}>
        <AccountSidebar onSignOut={handleSignOut} />
        <div className={styles['contentCol']}>
          <h1 className={styles['pageTitle']}>{s.title}</h1>
          <ProfileCard user={user} />
          <PreferencesCard />
          <StatsCard />
        </div>
      </div>
    </WebShell>
  );
}
