import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import type { PantryUnit } from '@pantry/contracts';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ConsumeRowModel } from '../consumeRows';
import { cookStrings as s } from '../strings';

const COUNT_UNITS = new Set<PantryUnit>(['ea', 'stick', 'pack', 'jar', 'tin', 'bottle', 'bunch', 'head', 'bag']);

export interface ConsumeRowProps {
  row: ConsumeRowModel;
  /** The recipe-default quantity, used by the "as recipe" pill. */
  baseline: number;
  onChange: (row: ConsumeRowModel) => void;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** One editable consume row: stepper + context pills (board §★ ConsumeRow). */
export function ConsumeRow({ row, baseline, onChange }: ConsumeRowProps) {
  const step = COUNT_UNITS.has(row.unit) ? 1 : 0.25;

  const setQuantity = (next: number): void => {
    const quantityUsed = round2(Math.max(0, Math.min(row.have, next)));
    onChange({ ...row, quantityUsed, finished: quantityUsed >= row.have });
  };
  const usedItAll = (): void => {
    onChange({ ...row, quantityUsed: row.have, finished: true });
  };

  const qtyLabel = `${row.quantityUsed.toString()} ${row.unit}`;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.name}>{row.name}</Text>
        <Text style={styles.have}>{s.have(`${row.have.toString()} ${row.unit}`)}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.stepper}>
          <Pressable
            testID={`consume-dec-${row.pantryItemId}`}
            onPress={() => {
              setQuantity(row.quantityUsed - step);
            }}
            style={styles.stepBtn}
          >
            <Icon name="Minus" size={14} color={tokens.fgMuted} />
          </Pressable>
          <Text style={styles.qty}>{qtyLabel}</Text>
          <Pressable
            testID={`consume-inc-${row.pantryItemId}`}
            onPress={() => {
              setQuantity(row.quantityUsed + step);
            }}
            style={styles.stepBtn}
          >
            <Icon name="Plus" size={14} color={tokens.fgMuted} />
          </Pressable>
        </View>

        <View style={styles.pills}>
          <Pressable onPress={usedItAll} style={[styles.pill, row.finished ? styles.pillFinished : styles.pillIdle]}>
            <Text style={[styles.pillText, row.finished && styles.pillFinishedText]}>{s.usedItAll}</Text>
          </Pressable>
          {!row.finished && (
            <>
              <Pressable
                onPress={() => {
                  setQuantity(baseline);
                }}
                style={[styles.pill, styles.pillIdle]}
              >
                <Text style={styles.pillText}>{s.asRecipe}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setQuantity(baseline * 1.5);
                }}
                style={[styles.pill, styles.pillIdle]}
              >
                <Text style={styles.pillText}>{s.usedMore}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setQuantity(baseline * 0.5);
                }}
                style={[styles.pill, styles.pillIdle]}
              >
                <Text style={styles.pillText}>{s.usedLess}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.bgRaised, borderWidth: 1, borderColor: tokens.line, borderRadius: 12, padding: 14 },
  head: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  name: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '600', color: tokens.fg },
  have: { marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: tokens.line, borderRadius: 10, overflow: 'hidden' },
  stepBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 64, textAlign: 'center', fontFamily: fonts.mono, fontSize: 13, fontWeight: '500', color: tokens.fg },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 },
  pill: { borderRadius: tokens.rPill, borderWidth: 1, paddingVertical: 5, paddingHorizontal: 9 },
  pillIdle: { borderColor: tokens.lineStrong, backgroundColor: tokens.bg },
  pillFinished: { borderColor: tokens.warning, backgroundColor: tokens.warningSoft },
  pillText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '500', color: tokens.fgMuted },
  pillFinishedText: { color: tokens.warningFg },
});
