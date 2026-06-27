import type { PantryCategory } from '@pantry/contracts';
import { BottomSheet, Button, Eyebrow, Field, Input, SheetRow } from '@pantry/design-system/native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CATEGORY_OPTIONS } from '../../ingredient/pickerOptions';
import type { ReviewRow, ReviewRowPatch } from '../useScanFlow';
import { scanStrings } from '../strings';

const s = scanStrings.editSheet;

export interface EditItemSheetProps {
  open: boolean;
  row: ReviewRow | null;
  onSave: (patch: ReviewRowPatch) => void;
  onClose: () => void;
}

/** Inline edit for a detected scan row — name, quantity, category (board §08). */
export function EditItemSheet({ open, row, onSave, onClose }: EditItemSheetProps) {
  // The parent remounts this sheet (via `key`) per edited row, so initial state
  // can be derived directly from `row` without a prop→state sync effect.
  const [name, setName] = useState(row?.name ?? '');
  const [quantity, setQuantity] = useState(row?.quantity == null ? '' : String(row.quantity));
  const [category, setCategory] = useState<PantryCategory>(row?.category ?? 'pantry');

  const save = (): void => {
    const parsed = quantity.trim() === '' ? null : Number(quantity);
    const nextQuantity = parsed !== null && Number.isFinite(parsed) ? parsed : null;
    onSave({ name: name.trim(), quantity: nextQuantity, category });
    onClose();
  };

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
          <Button testID="edit-item-save" kind="primary" full onPress={save}>
            {s.save}
          </Button>
        </View>
      }
    >
      <Field label={s.nameLabel}>
        <Input testID="edit-item-name" value={name} onChangeText={setName} />
      </Field>
      <Field label={s.quantityLabel}>
        <Input testID="edit-item-quantity" value={quantity} onChangeText={setQuantity} />
      </Field>
      <Eyebrow style={styles.categoryLabel}>{s.categoryLabel}</Eyebrow>
      {CATEGORY_OPTIONS.map((opt, i) => (
        <SheetRow
          key={opt.value}
          icon={opt.icon}
          label={opt.label}
          sub={opt.sub}
          selected={category === opt.value}
          last={i === CATEGORY_OPTIONS.length - 1}
          onPress={() => {
            setCategory(opt.value);
          }}
        />
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: 8 },
  categoryLabel: { marginTop: 14, marginBottom: 4 },
});
