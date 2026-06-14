import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  kind?: ButtonKind;
  size?: ButtonSize;
  children: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  full?: boolean;
  disabled?: boolean;
  onPress?: (() => void) | undefined;
  testID?: string;
  style?: ViewStyle;
}

const sizing = {
  sm: { height: 32, paddingHorizontal: 12, fontSize: 13, gap: 6 },
  md: { height: 38, paddingHorizontal: 16, fontSize: 14, gap: 8 },
  lg: { height: 46, paddingHorizontal: 22, fontSize: 15, gap: 10 },
} as const;

const palette: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: tokens.accent, fg: tokens.accentFg },
  secondary: { bg: 'transparent', fg: tokens.fg, border: tokens.lineStrong },
  ghost: { bg: 'transparent', fg: tokens.fg },
  inverse: { bg: tokens.bgInverse, fg: tokens.bg },
  danger: { bg: 'transparent', fg: tokens.danger, border: tokens.dangerSoft },
};

export function Button({
  kind = 'primary',
  size = 'md',
  children,
  leftIcon,
  rightIcon,
  full = false,
  disabled = false,
  onPress,
  testID,
  style,
}: ButtonProps) {
  const s = sizing[size];
  const p = palette[kind];
  return (
    <Pressable
      role="button"
      disabled={disabled}
      onPress={onPress}
      {...(testID === undefined ? {} : { testID })}
      style={[
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          gap: s.gap,
          backgroundColor: p.bg,
        },
        p.border !== undefined && { borderWidth: 1, borderColor: p.border },
        full && styles.full,
        disabled && styles.disabled,
        style,
      ]}
    >
      {leftIcon}
      <Text
        style={[
          styles.label,
          // Web sibling tracks labels at -0.005em.
          { fontSize: s.fontSize, letterSpacing: s.fontSize * -0.005, color: p.fg },
        ]}
      >
        {children}
      </Text>
      {rightIcon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.rMd,
    alignSelf: 'flex-start',
  },
  full: { alignSelf: 'stretch' },
  disabled: { opacity: 0.5 },
  label: { fontFamily: fonts.sans, fontWeight: '500' },
});
