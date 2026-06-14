import type { PantryItem } from '@pantry/contracts';
import { Eyebrow } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, View } from 'react-native';
import { PantryRow } from './PantryRow';

export interface PantrySectionProps {
  title: string;
  items: PantryItem[];
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
}

export function PantrySection({ title, items, isSelected, onToggle }: PantrySectionProps) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Eyebrow style={styles.heading}>{title}</Eyebrow>
      <View style={styles.card}>
        {items.map((item, index) => (
          <PantryRow
            key={item.id}
            item={item}
            selected={isSelected(item.id)}
            isLast={index === items.length - 1}
            onToggle={onToggle}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  heading: {
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
});
