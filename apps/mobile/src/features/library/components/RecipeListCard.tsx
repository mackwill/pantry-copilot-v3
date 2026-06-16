import type { RecipeListItem } from '@pantry/contracts';
import { Icon, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { libraryStrings as s } from '../strings';

export interface RecipeListCardProps {
  item: RecipeListItem;
  onPress: (id: string) => void;
}

/** Board §03 mobile recipe row — title, time, desc, tone pill + when. */
export function RecipeListCard({ item, onPress }: RecipeListCardProps) {
  const adventurous = item.weirdness >= 70;
  return (
    <Pressable
      testID="recipe-card"
      style={styles.card}
      onPress={() => {
        onPress(item.id);
      }}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.title, adventurous ? styles.titleItalic : null]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.time}>{s.cardTime(item.timeMinutes)}</Text>
      </View>
      {item.summary !== null && item.summary.length > 0 ? (
        <Text style={styles.desc} numberOfLines={2}>
          {item.summary}
        </Text>
      ) : null}
      <View style={styles.metaRow}>
        <Pill tone={adventurous ? 'accent' : 'neutral'}>{s.weirdLabel(item.weirdness)}</Pill>
        {item.favorited ? <Icon name="Bookmark" size={13} color={tokens.accent} /> : null}
        <Text style={styles.when}>{s.relativeTime(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 17, lineHeight: 20, color: tokens.fg },
  titleItalic: { fontStyle: 'italic' },
  time: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  desc: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: tokens.fgMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  when: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle, marginLeft: 'auto' },
});
