import type { CSSProperties, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  padding?: number;
  style?: CSSProperties;
}

export function Card({ children, padding = 24, style }: CardProps) {
  return (
    <div className={styles['card']} style={{ padding, ...style }}>
      {children}
    </div>
  );
}
