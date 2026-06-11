import type { CSSProperties, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  kind?: ButtonKind;
  size?: ButtonSize;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  full?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: CSSProperties;
  onClick?: () => void;
}

export function Button({
  kind = 'primary',
  size = 'md',
  children,
  leftIcon,
  rightIcon,
  full = false,
  disabled = false,
  type = 'button',
  style,
  onClick,
}: ButtonProps) {
  const className = [styles['button'], styles[kind], styles[size], full ? styles['full'] : null]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={className} style={style} disabled={disabled} onClick={onClick}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
