import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type ViewStyle } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';

export interface InputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  leftIcon?: ReactNode;
  testID?: string;
  style?: ViewStyle;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  leftIcon,
  testID,
  style,
}: InputProps) {
  return (
    <View style={[styles.wrap, style]}>
      {leftIcon !== undefined && <View>{leftIcon}</View>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.fgSubtle}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        {...(testID === undefined ? {} : { testID })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rMd,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: tokens.fg,
    // Web sibling tracks input text at -0.005em.
    letterSpacing: 14 * -0.005,
    padding: 0,
  },
});
