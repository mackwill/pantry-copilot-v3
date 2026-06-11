import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';
import { Icon, type IconName } from '../Icon/Icon.js';

export interface SheetRowProps {
  label: string;
  sub?: string;
  icon?: IconName;
  selected?: boolean;
  /** Suppresses the divider on the final row of a picker list. */
  last?: boolean;
  onPress?: (() => void) | undefined;
}

/** Picker list row used inside BottomSheet (category, location, best-by). */
export function SheetRow({ label, sub, icon, selected = false, last = false, onPress }: SheetRowProps) {
  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      onPress={onPress}
      style={[styles.row, last ? null : styles.divider]}
    >
      {icon !== undefined && (
        <View style={[styles.iconBox, selected ? styles.iconBoxSelected : null]}>
          <Icon name={icon} size={16} color={selected ? tokens.accent : tokens.fgMuted} />
        </View>
      )}
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        {sub !== undefined && <Text style={styles.sub}>{sub}</Text>}
      </View>
      <View style={[styles.radio, selected ? styles.radioSelected : null]}>
        {selected && <Icon name="Check" size={12} color={tokens.accentFg} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: tokens.line },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: tokens.rMd,
    backgroundColor: tokens.bgSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: { backgroundColor: tokens.accentSoft },
  textCol: { flex: 1 },
  label: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.075,
    color: tokens.fg,
  },
  sub: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgSubtle, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: tokens.rPill,
    borderWidth: 1.5,
    borderColor: tokens.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: tokens.accent, borderWidth: 0 },
});
