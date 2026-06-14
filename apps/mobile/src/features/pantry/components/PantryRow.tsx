import type { PantryItem } from '@pantry/contracts';
import { Icon, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { freshnessFor, freshnessLabel } from '@pantry/utils';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryLabels, locationLabels, unitLabels } from '../../pantry-shared/labels';

export interface PantryRowProps {
  item: PantryItem;
  selected: boolean;
  isLast: boolean;
  onToggle: (id: string) => void;
}

export function PantryRow({ item, selected, isLast, onToggle }: PantryRowProps) {
  const freshness = freshnessFor(item.bestBy);
  const sub = `${String(item.quantity)} ${unitLabels[item.unit]} · ${categoryLabels[item.category]} · ${locationLabels[item.location]}`;

  return (
    <Pressable
      testID={`pantry-row-${item.id}`}
      onPress={() => {
        onToggle(item.id);
      }}
      style={[
        styles.row,
        isLast ? null : styles.divider,
        selected ? styles.rowSelected : null,
      ]}
    >
      <View style={[styles.checkbox, selected ? styles.checkboxSelected : null]}>
        {selected ? (
          <Icon name="Check" size={13} strokeWidth={2.5} color={tokens.accentFg} />
        ) : null}
      </View>
      <View style={styles.middle}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <Pill tone={freshness.tone}>{freshnessLabel(freshness)}</Pill>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
  },
  rowSelected: {
    backgroundColor: tokens.accentSoft,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: tokens.accent,
    borderColor: tokens.accent,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: '500',
    color: tokens.fg,
  },
  sub: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: tokens.fgSubtle,
  },
});
