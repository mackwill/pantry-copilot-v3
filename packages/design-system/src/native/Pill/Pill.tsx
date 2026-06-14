import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export type PillTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'inverse'
  | 'outline';

export interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  style?: ViewStyle;
}

interface ToneStyle {
  bg: string;
  fg: string;
  border?: string;
}

const palette: Record<PillTone, ToneStyle> = {
  neutral: { bg: tokens.bgSunk, fg: tokens.fgMuted },
  success: { bg: tokens.accentSoft, fg: tokens.accentHover },
  warning: { bg: tokens.warningSoft, fg: tokens.warningFg },
  danger: { bg: tokens.dangerSoft, fg: tokens.dangerFg },
  accent: { bg: tokens.accentSoft, fg: tokens.accent },
  inverse: { bg: tokens.bgInverse, fg: tokens.bg },
  outline: { bg: 'transparent', fg: tokens.fgMuted, border: tokens.line },
};

export function Pill({ children, tone = 'neutral', style }: PillProps) {
  const p = palette[tone];
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: p.bg },
        p.border === undefined ? null : { borderWidth: 1, borderColor: p.border },
        style,
      ]}
    >
      <Text style={[styles.label, { color: p.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: tokens.rPill,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 11 * 0.005,
  },
});
