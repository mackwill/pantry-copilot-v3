import type { PantryItem } from '@pantry/contracts';
import { Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { generationStrings } from '../strings';
import { ExpiringTapRow } from './ExpiringTapRow';

export interface ExpiringTapListProps {
  items: PantryItem[];
  pantryCount: number;
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
  onBrowse: () => void;
}

/** "Tap to add · expiring" — the obvious tap target on the §01 Home. */
export function ExpiringTapList({ items, pantryCount, isSelected, onToggle, onBrowse }: ExpiringTapListProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Eyebrow>{generationStrings.home.tapToAdd}</Eyebrow>
        <Pressable testID="browse-pantry" onPress={onBrowse} hitSlop={8} style={styles.browse}>
          <Text style={styles.browseText}>{generationStrings.home.browsePantry(pantryCount)}</Text>
          <Icon name="ChevronRight" size={12} color={tokens.accent} />
        </Pressable>
      </View>
      <View style={styles.card}>
        {items.map((item, i) => (
          <ExpiringTapRow
            key={item.id}
            item={item}
            selected={isSelected(item.id)}
            isLast={i === items.length - 1}
            onToggle={onToggle}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  browse: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  browseText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: tokens.accent },
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
