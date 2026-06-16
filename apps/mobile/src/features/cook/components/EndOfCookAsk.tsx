import { Button, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ConsumeRowModel } from '../consumeRows';
import { cookStrings as s } from '../strings';

export interface EndOfCookAskProps {
  totalSteps: number;
  rows: readonly ConsumeRowModel[];
  onConfirm: () => void;
  onAdjust: () => void;
  onNotNow: () => void;
}

function deductLabel(row: ConsumeRowModel): string {
  return `−${row.quantityUsed.toString()} ${row.unit}`;
}

function hintFor(row: ConsumeRowModel): string {
  if (row.finished) return s.finishesIt;
  const left = Math.max(0, row.have - row.quantityUsed);
  return s.leftHint(`${left.toString()} ${row.unit}`);
}

/** Board §★ mobile "End of cook · the ask" — confirm and deduct, or adjust. */
export function EndOfCookAsk({ totalSteps, rows, onConfirm, onAdjust, onNotNow }: EndOfCookAskProps) {
  return (
    <View testID="end-of-cook" style={styles.screen}>
      <View style={styles.topbar}>
        <Pressable testID="end-of-cook-close" onPress={onNotNow} hitSlop={10}>
          <Icon name="X" size={20} color={tokens.stove.fgMuted} />
        </Pressable>
        <Text style={styles.topEyebrow}>{`Step ${totalSteps.toString()} of ${totalSteps.toString()} · finished`}</Text>
        <View style={styles.segments}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <View key={i} style={styles.segmentOn} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{s.youreDone}</Text>
        <Text style={styles.heading}>
          {s.plateIt}
          {'\n'}
          <Text style={styles.headingAccent}>{s.didYouCook}</Text>
        </Text>
        <Text style={styles.blurb}>{s.cookBlurb}</Text>

        <View style={styles.receipt}>
          <View style={styles.receiptHead}>
            <Icon name="PackageMinus" size={13} color={tokens.fgMuted} />
            <Text style={styles.receiptEyebrow}>{s.willDeduct}</Text>
            <Text style={styles.receiptCount}>{s.itemsCount(rows.length)}</Text>
          </View>
          {rows.map((row) => (
            <View key={row.pantryItemId} style={styles.receiptRow}>
              <Text style={styles.receiptName}>{row.name}</Text>
              <View style={styles.dotted} />
              <Text style={styles.receiptQty}>{deductLabel(row)}</Text>
              <Text style={[styles.receiptHint, row.finished && styles.receiptHintWarn]}>{hintFor(row)}</Text>
            </View>
          ))}
        </View>

        <Button
          kind="primary"
          full
          size="lg"
          testID="confirm-cooked"
          onPress={onConfirm}
          leftIcon={<Icon name="Check" size={16} color={tokens.accentFg} />}
        >
          {s.iCookedThis}
        </Button>
        <View style={{ height: 8 }} />
        <Button kind="secondary" full size="md" testID="adjust-used" onPress={onAdjust}>
          {s.adjustUsed}
        </Button>
        <Pressable onPress={onNotNow} style={styles.notNow} hitSlop={8}>
          <Text style={styles.notNowText}>{s.notNow}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg },
  topbar: { backgroundColor: tokens.stove.bg, paddingTop: 54, paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  topEyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.stove.fgSubtle,
  },
  segments: { flexDirection: 'row', gap: 6 },
  segmentOn: { flex: 1, height: 3, borderRadius: 2, backgroundColor: tokens.stove.accent },
  content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.accent,
    marginBottom: 8,
  },
  heading: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, letterSpacing: -0.9, color: tokens.fg, marginBottom: 10 },
  headingAccent: { color: tokens.accent, fontStyle: 'italic' },
  blurb: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: tokens.fgMuted, marginBottom: 24 },
  receipt: { backgroundColor: tokens.bgRaised, borderWidth: 1, borderColor: tokens.line, borderRadius: 14, padding: 16, marginBottom: 16 },
  receiptHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  receiptEyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.fgSubtle,
  },
  receiptCount: { marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  receiptName: { fontFamily: fonts.sans, fontSize: 13, color: tokens.fg },
  dotted: { flex: 1, borderBottomWidth: 1, borderStyle: 'dotted', borderColor: tokens.line },
  receiptQty: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgMuted },
  receiptHint: { fontFamily: fonts.mono, fontSize: 10, color: tokens.fgSubtle, minWidth: 64, textAlign: 'right' },
  receiptHintWarn: { color: tokens.warning },
  notNow: { alignSelf: 'center', marginTop: 10 },
  notNowText: { fontFamily: fonts.sans, fontSize: 12, color: tokens.fgMuted, textDecorationLine: 'underline' },
});
