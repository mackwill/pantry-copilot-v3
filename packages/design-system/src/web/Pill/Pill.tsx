import type { CSSProperties, ReactNode } from 'react';
import styles from './Pill.module.css';

export type PillTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'inverse'
  | 'outline';

export interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  style?: CSSProperties;
}

export function Pill({ children, tone = 'neutral', style }: PillProps) {
  return (
    <span className={`${styles['pill'] ?? ''} ${styles[tone] ?? ''}`} style={style}>
      {children}
    </span>
  );
}
