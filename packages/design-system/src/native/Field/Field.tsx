import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function Field({ label, hint, error, children, style }: FieldProps) {
  return (
    <View style={style}>
      {label !== undefined && <Text style={styles.label}>{label}</Text>}
      {children}
      {hint !== undefined && error === undefined && <Text style={styles.hint}>{hint}</Text>}
      {error !== undefined && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    // Web sibling tracks the label at 0.005em.
    letterSpacing: 12 * 0.005,
    color: tokens.fgMuted,
    marginBottom: 6,
  },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: tokens.fgSubtle, marginTop: 6 },
  error: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.danger,
    marginTop: 6,
  },
});
