import { Eyebrow } from '@pantry/design-system/web';
import { accountStrings as s } from '../strings';
import styles from '../account.module.css';

interface AccountSidebarProps {
  onSignOut: () => void;
}

export function AccountSidebar({ onSignOut }: AccountSidebarProps) {
  return (
    <nav>
      <div className={styles['sidebarEyebrow']}>
        <Eyebrow>{s.settingsEyebrow}</Eyebrow>
      </div>
      {s.settingsNav.map((label) => {
        const isSelected = label === 'Account';
        const isSignOut = label === s.signOut;

        if (isSignOut) {
          return (
            <button
              key={label}
              type="button"
              className={[styles['navRow'], styles['navRowSignOut']].join(' ')}
              onClick={onSignOut}
            >
              {label}
            </button>
          );
        }

        return (
          <button
            key={label}
            type="button"
            className={[styles['navRow'], isSelected ? styles['navRowSelected'] : ''].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
