import { Eyebrow } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { accountStrings as s } from '../strings';
import styles from '../account.module.css';

type SidebarKey = 'account' | 'diet';

const NAV = [
  { key: 'account', label: s.settingsNav.account, to: '/settings' },
  { key: 'diet', label: s.settingsNav.diet, to: '/settings/diet' },
  { key: 'billing', label: s.settingsNav.billing, to: '/upgrade' },
] as const;

interface AccountSidebarProps {
  onSignOut: () => void;
  current?: SidebarKey;
}

export function AccountSidebar({ onSignOut, current = 'account' }: AccountSidebarProps) {
  const navigate = useNavigate();

  return (
    <nav>
      <div className={styles['sidebarEyebrow']}>
        <Eyebrow>{s.settingsEyebrow}</Eyebrow>
      </div>
      {NAV.map((item) => (
        <button
          key={item.key}
          type="button"
          className={[styles['navRow'], item.key === current ? styles['navRowSelected'] : ''].join(' ')}
          onClick={() => void navigate({ to: item.to })}
        >
          {item.label}
        </button>
      ))}
      <button
        type="button"
        className={[styles['navRow'], styles['navRowSignOut']].join(' ')}
        onClick={onSignOut}
      >
        {s.signOut}
      </button>
    </nav>
  );
}
