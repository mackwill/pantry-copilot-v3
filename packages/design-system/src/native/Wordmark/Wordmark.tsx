import { StyleSheet, Text } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

const BRAND = { pantry: 'Pantry', co: 'Co', pilot: 'Pilot' } as const;

export interface WordmarkProps {
  size?: number;
  color?: string;
  accent?: string;
  testID?: string;
}

export function Wordmark({
  size = 26,
  color = tokens.fg,
  accent = tokens.accent,
  testID,
}: WordmarkProps) {
  return (
    // Web sibling: 500 weight, line-height 1, -0.02em tracking — scaled by size here.
    <Text
      style={[styles.mark, { fontSize: size, lineHeight: size, letterSpacing: size * -0.02, color }]}
      {...(testID === undefined ? {} : { testID })}
    >
      {BRAND.pantry}
      <Text style={[styles.co, { color: accent }]}>{BRAND.co}</Text>
      {BRAND.pilot}
    </Text>
  );
}

const styles = StyleSheet.create({
  mark: { fontFamily: fonts.display, fontWeight: '500' },
  co: { fontFamily: fonts.displayItalic, fontStyle: 'italic' },
});
