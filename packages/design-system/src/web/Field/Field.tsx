import type { CSSProperties, ReactNode } from 'react';
import styles from './Field.module.css';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function Field({ label, hint, error, children, style }: FieldProps) {
  return (
    <label className={styles['field']} style={style}>
      {label !== undefined && <div className={styles['label']}>{label}</div>}
      {children}
      {hint !== undefined && error === undefined && <div className={styles['hint']}>{hint}</div>}
      {error !== undefined && <div className={styles['error']}>{error}</div>}
    </label>
  );
}
