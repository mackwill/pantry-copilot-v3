import type { PantryCategory } from '@pantry/contracts';
import { BottomSheet, Button, SheetRow } from '@pantry/design-system/native';
import { StyleSheet, View } from 'react-native';
import { categoryLabels } from '../../pantry-shared/labels';
import { CATEGORY_OPTIONS } from '../pickerOptions';
import { sheetStrings } from '../strings';

const s = sheetStrings.category;

export interface CategorySheetProps {
  open: boolean;
  value: PantryCategory;
  onSelect: (value: PantryCategory) => void;
  onClose: () => void;
}

/** Category picker — selection applies live via `onSelect`; the footer just confirms/closes. */
export function CategorySheet({ open, value, onSelect, onClose }: CategorySheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow={s.eyebrow}
      title={s.title}
      footer={
        <View style={styles.footer}>
          <Button kind="secondary" full onPress={onClose}>
            {s.cancel}
          </Button>
          <Button kind="primary" full onPress={onClose}>
            {s.use(categoryLabels[value])}
          </Button>
        </View>
      }
    >
      {CATEGORY_OPTIONS.map((opt, i) => (
        <SheetRow
          key={opt.value}
          icon={opt.icon}
          label={opt.label}
          sub={opt.sub}
          selected={value === opt.value}
          last={i === CATEGORY_OPTIONS.length - 1}
          onPress={() => {
            onSelect(opt.value);
          }}
        />
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: 8 },
});
