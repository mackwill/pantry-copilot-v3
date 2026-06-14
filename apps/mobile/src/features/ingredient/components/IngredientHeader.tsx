import { Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formStrings } from '../strings';

export interface IngredientHeaderProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
}

/** Modal header: close (X) on the left, centered title, Save action on the right. */
export function IngredientHeader({ title, onClose, onSave }: IngredientHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable testID="close-ingredient" onPress={onClose} hitSlop={8}>
        <Icon name="X" size={22} color={tokens.fgMuted} />
      </Pressable>
      <Eyebrow>{title}</Eyebrow>
      <Pressable testID="save-ingredient" onPress={onSave} hitSlop={8}>
        <Text style={styles.save}>{formStrings.save}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  save: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: tokens.accent,
  },
});
