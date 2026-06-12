import type { CSSProperties } from 'react';

export interface ChromeProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  // `| undefined` so the Icon wrapper can pass its own optional style through.
  style?: CSSProperties | undefined;
}

/* lucide removed its brand icons before 1.17.0; the board's Google button uses
   the old lucide `chrome` glyph, so its v0.460.0 geometry is pinned here. */
export function Chrome({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  style,
}: ChromeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" x2="12" y1="8" y2="8" />
      <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
      <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
    </svg>
  );
}
