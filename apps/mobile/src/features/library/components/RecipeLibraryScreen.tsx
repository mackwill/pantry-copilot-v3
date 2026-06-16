import type { RecipeLibraryFilter, RecipeListItem } from '@pantry/contracts';
import { tokens } from '@pantry/design-system/tokens';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { NewAskSheet } from '../sheets/NewAskSheet';
import { CookNewButton } from './CookNewButton';
import { LibraryFilters } from './LibraryFilters';
import { LibraryHeader } from './LibraryHeader';
import { RecentlyGenerated } from './RecentlyGenerated';
import { RecipeListCard } from './RecipeListCard';

const RECENT_LIMIT = 3;

export interface RecipeLibraryScreenProps {
  items: readonly RecipeListItem[];
}

/** Board §03 mobile Cook tab — the recipe library (decision A). */
export function RecipeLibraryScreen({ items }: RecipeLibraryScreenProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<RecipeLibraryFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const savedCount = useMemo(() => items.filter((item) => item.favorited).length, [items]);
  const visible = useMemo(
    () => (filter === 'favorites' ? items.filter((item) => item.favorited) : items),
    [items, filter],
  );
  const recent = useMemo(() => items.slice(0, RECENT_LIMIT), [items]);

  const openRecipe = (id: string): void => {
    router.push(`/${id}`);
  };

  return (
    <View testID="library-screen" style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LibraryHeader
          savedCount={savedCount}
          onNew={() => {
            setSheetOpen(true);
          }}
        />
        <LibraryFilters active={filter} onChange={setFilter} />
        <View style={styles.list}>
          {visible.map((item) => (
            <RecipeListCard key={item.id} item={item} onPress={openRecipe} />
          ))}
        </View>
        <RecentlyGenerated items={recent} onPress={openRecipe} />
        <CookNewButton
          onPress={() => {
            setSheetOpen(true);
          }}
        />
      </ScrollView>

      <NewAskSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
        }}
        onCook={(prompt, weirdness) => {
          setSheetOpen(false);
          router.push({ pathname: '/generate', params: { prompt, weirdness: String(weirdness) } });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 120, gap: 18 },
  list: { gap: 8 },
});
