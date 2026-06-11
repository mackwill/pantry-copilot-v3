import type { ReactNode } from 'react';
import { Eyebrow } from '../Eyebrow/Eyebrow.js';
import { Icon, type IconName } from '../Icon/Icon.js';
import { Wordmark } from '../Wordmark/Wordmark.js';
import styles from './WebShell.module.css';

export interface WebShellNavItem {
  id: string;
  label: string;
  icon: IconName;
}

export interface WebShellUser {
  initials: string;
  name: string;
  email: string;
}

export interface WebShellSearch {
  placeholder: string;
  shortcut?: string | undefined;
  onClick?: (() => void) | undefined;
}

export interface WebShellProps {
  navItems: WebShellNavItem[];
  activeId?: string | undefined;
  onNavigate?: ((id: string) => void) | undefined;
  /** Secondary sidebar section (the board's "Lists"). */
  listsLabel?: ReactNode;
  lists?: WebShellNavItem[] | undefined;
  user?: WebShellUser | undefined;
  search?: WebShellSearch | undefined;
  topbarRight?: ReactNode;
  hideTopbar?: boolean;
  children: ReactNode;
}

interface NavButtonProps {
  item: WebShellNavItem;
  active: boolean;
  secondary?: boolean;
  onNavigate?: ((id: string) => void) | undefined;
}

function NavButton({ item, active, secondary = false, onNavigate }: NavButtonProps) {
  const className = [
    styles['nav'],
    secondary ? styles['navSecondary'] : null,
    active ? styles['navActive'] : null,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={className}
      aria-current={active ? 'page' : undefined}
      onClick={() => onNavigate?.(item.id)}
    >
      <Icon name={item.icon} size={secondary ? 16 : 18} color="currentColor" />
      {item.label}
    </button>
  );
}

/** Shared web chrome — sidebar nav and topbar. Nav items are props; no routing dependency. */
export function WebShell({
  navItems,
  activeId,
  onNavigate,
  listsLabel,
  lists,
  user,
  search,
  topbarRight,
  hideTopbar = false,
  children,
}: WebShellProps) {
  return (
    <div className={styles['shell']}>
      <aside className={styles['sidebar']}>
        <div className={styles['brand']}>
          <Wordmark size={24} />
        </div>
        {navItems.map((item) => (
          <NavButton key={item.id} item={item} active={item.id === activeId} onNavigate={onNavigate} />
        ))}
        {lists !== undefined && lists.length > 0 && (
          <>
            <div className={styles['divider']} />
            {listsLabel !== undefined && (
              <Eyebrow style={{ padding: '0 12px', marginBottom: 6 }}>{listsLabel}</Eyebrow>
            )}
            {lists.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={item.id === activeId}
                secondary
                onNavigate={onNavigate}
              />
            ))}
          </>
        )}
        {user !== undefined && (
          <div className={styles['user']}>
            <div className={styles['avatar']}>{user.initials}</div>
            <div className={styles['userText']}>
              <div className={styles['userName']}>{user.name}</div>
              <div className={styles['userEmail']}>{user.email}</div>
            </div>
          </div>
        )}
      </aside>
      <div className={styles['main']}>
        {!hideTopbar && (
          <div className={styles['topbar']}>
            {search !== undefined && (
              <button type="button" className={styles['search']} onClick={() => search.onClick?.()}>
                <Icon name="Search" size={16} color="var(--fg-subtle)" />
                <span className={styles['searchText']}>{search.placeholder}</span>
                {search.shortcut !== undefined && (
                  <span className={styles['shortcut']}>{search.shortcut}</span>
                )}
              </button>
            )}
            <div className={styles['topbarRight']}>{topbarRight}</div>
          </div>
        )}
        <div className={styles['content']}>{children}</div>
      </div>
    </div>
  );
}
