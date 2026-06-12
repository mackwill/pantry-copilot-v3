import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export interface EyebrowProps {
  children: ReactNode;
  color?: string;
  style?: TextStyle;
}

export function Eyebrow({ children, color = tokens.fgSubtle, style }: EyebrowProps) {
  return <Text style={[styles.eyebrow, { color }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 11,
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
  },
});
