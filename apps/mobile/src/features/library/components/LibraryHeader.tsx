import { Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { libraryStrings as s } from '../strings';

export interface LibraryHeaderProps {
  savedCount: number;
  onNew: () => void;
  onToggleSearch: () => void;
  searchActive: boolean;
  onOpenSort: () => void;
}

/** Board §03 mobile header — eyebrow, search/sort/New cluster, display heading + counts. */
export function LibraryHeader({ savedCount, onNew, onToggleSearch, searchActive, onOpenSort }: LibraryHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Eyebrow>{s.eyebrow}</Eyebrow>
        <View style={styles.cluster}>
          <Pressable testID="library-search-toggle" onPress={onToggleSearch} hitSlop={8}>
            <Icon name="Search" size={18} color={searchActive ? tokens.accent : tokens.fgMuted} />
          </Pressable>
          <Pressable testID="library-sort-toggle" onPress={onOpenSort} hitSlop={8}>
            <Icon name="ArrowDownUp" size={18} color={tokens.fgMuted} />
          </Pressable>
          <Pressable testID="cook-new-button" style={styles.newPill} onPress={onNew}>
            <Icon name="Sparkles" size={12} color={tokens.accentFg} />
            <Text style={styles.newText}>{s.newButton}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.heading}>
        {s.headingLead}
        {'\n'}
        <Text style={styles.headingAccent}>{s.headingAccent}</Text>
      </Text>
      <Text style={styles.counts}>{s.savedCount(savedCount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cluster: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  newPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: tokens.accent,
  },
  newText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600', color: tokens.accentFg },
  heading: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, color: tokens.fg },
  headingAccent: { color: tokens.accent, fontStyle: 'italic' },
  counts: { fontFamily: fonts.mono, fontSize: 13, color: tokens.fg },
});
