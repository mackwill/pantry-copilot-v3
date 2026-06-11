import type { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange?: ((id: string) => void) | undefined;
}

/**
 * Web tab row — the board's pill row (e.g. inventory category filters). The selected
 * tab gets the inverse fill: unmistakable, per the v2 "too subtle" fix.
 */
export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div role="tablist" className={styles['tablist']}>
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        const className = [styles['tab'], selected ? styles['active'] : null]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={className}
            onClick={() => onChange?.(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
