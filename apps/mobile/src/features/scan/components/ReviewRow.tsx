import { Icon } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReviewRow as ReviewRowData } from '../useScanFlow';
import { scanStrings } from '../strings';

const CATEGORY_LABEL: Record<string, string> = {
  produce: 'Produce', dairy: 'Dairy', pantry: 'Pantry', protein: 'Protein', freezer: 'Freezer', drinks: 'Drinks', treats: 'Treats',
};

const LOW_CONFIDENCE = 0.5;

interface ReviewRowProps {
  row: ReviewRowData;
  isLast: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}

function metaLine(row: ReviewRowData): string {
  const qty = row.quantity === null ? '' : String(row.quantity);
  const cat = row.category === null ? '' : (CATEGORY_LABEL[row.category] ?? row.category);
  const pct = `${String(Math.round(row.confidence * 100))}%`;
  return [qty, cat, pct].filter((part) => part !== '').join(' · ');
}

export function ReviewRow({ row, isLast, onToggle, onEdit }: ReviewRowProps) {
  const low = row.confidence < LOW_CONFIDENCE;
  return (
    <View style={[styles.row, isLast ? null : styles.divider, { opacity: row.selected ? 1 : 0.55 }]}>
      <Pressable testID={`scan-row-toggle-${row.id}`} onPress={() => { onToggle(row.id); }} hitSlop={6}>
        <View style={[styles.checkbox, row.selected ? styles.checkboxOn : styles.checkboxOff]}>
          {row.selected ? <Icon name="Check" size={12} color={tokens.accentFg} /> : null}
        </View>
      </Pressable>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{row.name === '' ? scanStrings.review.untitledItem : row.name}</Text>
          {low ? <Text style={styles.low}>{scanStrings.review.lowConfidence}</Text> : null}
        </View>
        <Text style={styles.meta}>{metaLine(row)}</Text>
      </View>
      <Pressable testID={`scan-row-edit-${row.id}`} onPress={() => { onEdit(row.id); }} hitSlop={6}>
        <Icon name="Pencil" size={14} color={tokens.fgSubtle} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  divider: { borderBottomWidth: 1, borderBottomColor: tokens.line },
  checkbox: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: tokens.accent },
  checkboxOff: { backgroundColor: tokens.bgSunk, borderWidth: 1, borderColor: tokens.lineStrong },
  body: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '500', color: tokens.fg },
  low: { fontSize: 11, color: tokens.warning },
  meta: { fontSize: 12, color: tokens.fgSubtle, marginTop: 2 },
});
