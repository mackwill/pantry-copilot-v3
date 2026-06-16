import type { RecipeLibraryFilter } from '@pantry/contracts';
import { fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { LIBRARY_FILTER_TABS } from '../strings';

export interface LibraryFiltersProps {
  active: RecipeLibraryFilter;
  onChange: (filter: RecipeLibraryFilter) => void;
}

/** Board §03 horizontal filter pills. All/Saved are data-backed; rest disabled until M6. */
export function LibraryFilters({ active, onChange }: LibraryFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {LIBRARY_FILTER_TABS.map((tab) => {
        const enabled = tab.filter !== undefined;
        const on = enabled && tab.filter === active;
        return (
          <Pressable
            key={tab.id}
            testID={`library-filter-${tab.id}`}
            disabled={!enabled}
            onPress={() => {
              if (tab.filter !== undefined) onChange(tab.filter);
            }}
            style={[styles.pill, on ? styles.pillOn : null, enabled ? null : styles.pillDisabled]}
          >
            <Text style={[styles.text, on ? styles.textOn : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6, paddingRight: 20 },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: tokens.line },
  pillOn: { backgroundColor: tokens.bgInverse, borderColor: tokens.bgInverse },
  pillDisabled: { opacity: 0.45 },
  text: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: tokens.fgMuted },
  textOn: { color: tokens.bg },
});
