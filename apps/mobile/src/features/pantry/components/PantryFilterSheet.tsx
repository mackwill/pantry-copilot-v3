import type { PantryCategory } from '@pantry/contracts';
import { BottomSheet, SheetRow } from '@pantry/design-system/native';
import { CATEGORY_OPTIONS } from '../../ingredient/pickerOptions';
import { pantryStrings } from '../strings';

const s = pantryStrings.filter;

export interface PantryFilterSheetProps {
  open: boolean;
  value: PantryCategory | null;
  onSelect: (value: PantryCategory | null) => void;
  onClose: () => void;
}

/** Category filter for the pantry list — `null` means show everything. */
export function PantryFilterSheet({ open, value, onSelect, onClose }: PantryFilterSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} eyebrow={s.eyebrow} title={s.title}>
      <SheetRow
        icon="SlidersHorizontal"
        label={s.all}
        selected={value === null}
        onPress={() => {
          onSelect(null);
          onClose();
        }}
      />
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
            onClose();
          }}
        />
      ))}
    </BottomSheet>
  );
}
