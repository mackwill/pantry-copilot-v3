import { fonts, Icon } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface SettingsRowProps {
  label: string;
  value: string;
  last?: boolean;
  weirdnessValue?: boolean;
  onPress?: () => void;
}

export function SettingsRow({
  label,
  value,
  last = false,
  weirdnessValue = false,
  onPress,
}: SettingsRowProps) {
  const inner = (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.right}>
        <Text style={[styles.value, weirdnessValue && styles.weirdnessValue]} numberOfLines={1}>
          {value}
        </Text>
        <Icon name="ChevronRight" size={14} color={tokens.fgSubtle} />
      </View>
    </View>
  );
  return (
    <View style={styles.wrapper}>
      {onPress === undefined ? (
        inner
      ) : (
        <Pressable testID={`settings-row-${label}`} onPress={onPress}>
          {inner}
        </Pressable>
      )}
      {!last && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: tokens.fg,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  value: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: tokens.fgMuted,
  },
  weirdnessValue: {
    fontFamily: fonts.displayItalic,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.line,
    marginLeft: 16,
  },
});
