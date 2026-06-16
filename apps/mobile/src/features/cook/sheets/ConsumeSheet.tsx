import type { ConsumeItem } from '@pantry/contracts';
import { BottomSheet, Button, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ConsumeRowModel } from '../consumeRows';
import { toConsumeItems } from '../consumeRows';
import { cookStrings as s } from '../strings';
import { ConsumeRow } from './ConsumeRow';

export interface ConsumeSheetProps {
  open: boolean;
  onClose: () => void;
  initialRows: readonly ConsumeRowModel[];
  missing: readonly string[];
  onDeduct: (items: ConsumeItem[]) => void;
}

/** Board §★ Consume sheet — editable per-ingredient quantities before deduction. */
export function ConsumeSheet({ open, onClose, initialRows, missing, onDeduct }: ConsumeSheetProps) {
  const [rows, setRows] = useState<ConsumeRowModel[]>(() => initialRows.map((row) => ({ ...row })));
  const baselines = initialRows.map((row) => row.quantityUsed);

  const updateRow = (index: number, next: ConsumeRowModel): void => {
    setRows((prev) => prev.map((row, i) => (i === index ? next : row)));
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow={s.consumeEyebrow}
      title={s.consumeTitle}
      height={620}
      footer={
        <View style={styles.footer}>
          <Button
            kind="primary"
            full
            size="lg"
            testID="deduct-pantry"
            onPress={() => {
              onDeduct(toConsumeItems(rows));
            }}
            leftIcon={<Icon name="PackageMinus" size={15} color={tokens.accentFg} />}
          >
            {s.deduct}
          </Button>
          <Button kind="ghost" full size="sm" testID="skip-deduct" onPress={onClose}>
            {s.skip}
          </Button>
        </View>
      }
    >
      <View style={styles.info}>
        <Icon name="Info" size={13} color={tokens.accent} />
        <Text style={styles.infoText}>{s.consumeInfo}</Text>
      </View>

      <View style={styles.rows}>
        {rows.map((row, index) => (
          <ConsumeRow
            key={row.pantryItemId}
            row={row}
            baseline={baselines[index] ?? row.quantityUsed}
            onChange={(next) => {
              updateRow(index, next);
            }}
          />
        ))}
      </View>

      {missing.length > 0 && (
        <View style={styles.missing}>
          <Icon name="ShoppingCart" size={14} color={tokens.warning} />
          <View style={styles.missingBody}>
            <Text style={styles.missingName}>{missing.join(' · ')}</Text>
            <Text style={styles.missingHint}>{s.notInPantry}</Text>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  footer: { gap: 8 },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: tokens.accentSoft,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  infoText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: tokens.fg },
  rows: { gap: 10, paddingHorizontal: 20 },
  missing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: tokens.bgSunk,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
  },
  missingBody: { flex: 1 },
  missingName: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fg },
  missingHint: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle, marginTop: 1 },
});
