import type { CSSProperties, ReactNode } from 'react';
import styles from './Eyebrow.module.css';

export interface EyebrowProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Eyebrow({ children, style }: EyebrowProps) {
  return (
    <div className={styles['eyebrow']} style={style}>
      {children}
    </div>
  );
}
