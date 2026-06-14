import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { pantryStrings } from '../strings';

const COOK_BG = '#A4C46B';
const CHIP_BG = 'rgba(250,250,247,0.10)';
const EYEBROW_FG = 'rgba(250,250,247,0.55)';

export interface CookTrayProps {
  count: number;
  chipLabels: string[];
  onCook: () => void;
}

export function CookTray({ count, chipLabels, onCook }: CookTrayProps) {
  return (
    <View testID="cook-tray" style={styles.tray}>
      <View style={styles.left}>
        <Text style={styles.eyebrow}>{pantryStrings.cookWith(count)}</Text>
        <View style={styles.chips}>
          {chipLabels.map((label) => (
            <View key={label} style={styles.chip}>
              <Text style={styles.chipLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable testID="cook-button" onPress={onCook} style={styles.cookButton}>
        <Text style={styles.cookLabel}>{pantryStrings.cook}</Text>
        <Icon name="ArrowRight" size={16} strokeWidth={2.2} color={tokens.fg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: tokens.bgInverse,
    borderRadius: 16,
    shadowColor: tokens.fg,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  left: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
    color: EYEBROW_FG,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: tokens.rPill,
    backgroundColor: CHIP_BG,
  },
  chipLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.bg,
  },
  cookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COOK_BG,
  },
  cookLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: tokens.fg,
  },
});
