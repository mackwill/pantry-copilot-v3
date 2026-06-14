import type { PantryCategory, PantryLocation, PantryUnit } from '@pantry/contracts';
import { Icon, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryLabels, locationLabels } from '../../pantry-shared/labels';
import { formStrings } from '../strings';

export interface IngredientDetailsProps {
  quantity: string;
  unit: PantryUnit;
  category: PantryCategory;
  location: PantryLocation;
  onIncQuantity: () => void;
  onDecQuantity: () => void;
  onSelectUnit: (unit: PantryUnit) => void;
  onOpenCategory: () => void;
  onOpenLocation: () => void;
}

/** Shared Add/Edit body card: quantity stepper, unit pills, category & location rows. */
export function IngredientDetails({
  quantity,
  unit,
  category,
  location,
  onIncQuantity,
  onDecQuantity,
  onSelectUnit,
  onOpenCategory,
  onOpenLocation,
}: IngredientDetailsProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.row, styles.bordered]}>
        <Text style={styles.rowLabel}>{formStrings.quantity}</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.step} onPress={onDecQuantity} hitSlop={6}>
            <Icon name="Minus" size={14} color={tokens.fgMuted} />
          </Pressable>
          <Text style={styles.qty}>{quantity === '' ? '0' : quantity}</Text>
          <Pressable style={styles.step} onPress={onIncQuantity} hitSlop={6}>
            <Icon name="Plus" size={14} color={tokens.fgMuted} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.row, styles.bordered]}>
        <Text style={styles.rowLabel}>{formStrings.unit}</Text>
        <View style={styles.unitPills}>
          {formStrings.unitPills.map((u) => (
            <Pressable
              key={u}
              onPress={() => {
                onSelectUnit(u);
              }}
            >
              <Pill tone={u === unit ? 'inverse' : 'outline'} style={styles.unitPill}>
                {u}
              </Pill>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        testID="pick-category"
        style={[styles.row, styles.bordered]}
        onPress={onOpenCategory}
      >
        <Text style={styles.rowLabel}>{formStrings.category}</Text>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{categoryLabels[category]}</Text>
          <Icon name="ChevronRight" size={14} color={tokens.fgSubtle} />
        </View>
      </Pressable>

      <Pressable testID="pick-location" style={styles.row} onPress={onOpenLocation}>
        <Text style={styles.rowLabel}>{formStrings.location}</Text>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{locationLabels[location]}</Text>
          <Icon name="ChevronRight" size={14} color={tokens.fgSubtle} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
  },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.fgMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  step: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.line,
    backgroundColor: tokens.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: tokens.fg,
    minWidth: 28,
    textAlign: 'center',
  },
  unitPills: {
    flexDirection: 'row',
    gap: 6,
  },
  unitPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: tokens.fg,
  },
});
