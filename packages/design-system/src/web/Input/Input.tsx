import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import styles from './Input.module.css';

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  leftIcon?: ReactNode;
  name?: string;
  autoFocus?: boolean;
  style?: CSSProperties;
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  leftIcon,
  name,
  autoFocus = false,
  style,
}: InputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };
  return (
    <div className={styles['wrap']} style={style}>
      {leftIcon !== undefined && <span className={styles['leftIcon']}>{leftIcon}</span>}
      <input
        className={styles['input']}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        name={name}
        autoFocus={autoFocus}
      />
    </div>
  );
}
