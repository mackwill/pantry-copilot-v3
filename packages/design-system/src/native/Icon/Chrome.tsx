import Svg, { Circle, Line } from 'react-native-svg';

export interface ChromeProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  testID?: string;
}

/* lucide removed its brand icons before 1.17.0; the board's Google button uses
   the old lucide `chrome` glyph, so its v0.460.0 geometry is pinned here. */
export function Chrome({ size = 24, color = 'currentColor', strokeWidth = 2, testID }: ChromeProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(testID === undefined ? {} : { testID })}
    >
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="4" />
      <Line x1="21.17" x2="12" y1="8" y2="8" />
      <Line x1="3.95" x2="8.54" y1="6.06" y2="14" />
      <Line x1="10.88" x2="15.46" y1="21.94" y2="14" />
    </Svg>
  );
}
