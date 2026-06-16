import { fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { formatTimer } from '../strings';

export interface CookTimerRingProps {
  secondsRemaining: number;
  durationSeconds: number;
  size?: number;
}

/** Dark-stove circular countdown (board §03.5 mobile). Progress = remaining / duration. */
export function CookTimerRing({ secondsRemaining, durationSeconds, size = 64 }: CookTimerRingProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = durationSeconds > 0 ? Math.max(0, Math.min(1, secondsRemaining / durationSeconds)) : 0;
  const center = size / 2;
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} fill="none" stroke={tokens.stove.line} strokeWidth={stroke} />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={tokens.stove.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(circumference * pct).toString()} ${circumference.toString()}`}
          transform={`rotate(-90 ${center.toString()} ${center.toString()})`}
        />
      </Svg>
      <Text style={styles.value}>{formatTimer(secondsRemaining)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  value: {
    position: 'absolute',
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: -0.3,
    color: tokens.fgOnInverse,
  },
});
