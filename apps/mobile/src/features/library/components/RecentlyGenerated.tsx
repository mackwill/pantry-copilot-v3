import type { RecipeListItem } from '@pantry/contracts';
import { Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { libraryStrings as s } from '../strings';

export interface RecentlyGeneratedProps {
  items: readonly RecipeListItem[];
  onPress: (id: string) => void;
}

/** Board §03 "recently cooked" slot, rendered from persisted recipes (decision C). */
export function RecentlyGenerated({ items, onPress }: RecentlyGeneratedProps) {
  return (
    <View style={styles.wrap}>
      <Eyebrow>{s.recentEyebrow}</Eyebrow>
      {items.length === 0 ? (
        <Text style={styles.empty}>{s.emptyRecent}</Text>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.row, index < items.length - 1 ? styles.rowBorder : null]}
              onPress={() => {
                onPress(item.id);
              }}
            >
              <View style={styles.main}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.meta}>
                  {s.relativeTime(item.createdAt)}
                  {' · '}
                  {s.cardTime(item.timeMinutes)}
                </Text>
              </View>
              <Icon name="ChevronRight" size={14} color={tokens.fgSubtle} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  empty: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgSubtle },
  list: { backgroundColor: tokens.bgRaised, borderWidth: 1, borderColor: tokens.line, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.line },
  main: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fg },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle, marginTop: 2 },
});
