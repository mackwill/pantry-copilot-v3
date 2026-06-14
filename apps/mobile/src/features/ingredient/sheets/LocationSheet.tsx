import type { PantryLocation } from '@pantry/contracts';
import { BottomSheet, Button, Icon, SheetRow } from '@pantry/design-system/native';
import { StyleSheet, View } from 'react-native';
import { LOCATION_OPTIONS, LOCATION_SHORT_LABELS } from '../pickerOptions';
import { sheetStrings } from '../strings';

const s = sheetStrings.location;

export interface LocationSheetProps {
  open: boolean;
  value: PantryLocation;
  onSelect: (value: PantryLocation) => void;
  onClose: () => void;
}

/** Location picker — selection applies live via `onSelect`. "Add a place" is a no-op for now. */
export function LocationSheet({ open, value, onSelect, onClose }: LocationSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow={s.eyebrow}
      title={s.title}
      footer={
        <View style={styles.footer}>
          <Button kind="ghost" full leftIcon={<Icon name="Plus" size={14} />}>
            {s.addPlace}
          </Button>
          <Button kind="primary" full onPress={onClose}>
            {s.use(LOCATION_SHORT_LABELS[value])}
          </Button>
        </View>
      }
    >
      {LOCATION_OPTIONS.map((opt, i) => (
        <SheetRow
          key={opt.value}
          icon={opt.icon}
          label={opt.label}
          sub={opt.sub}
          selected={value === opt.value}
          last={i === LOCATION_OPTIONS.length - 1}
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
