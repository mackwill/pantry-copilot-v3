import type { CookSession, RecipeLibraryFilter, RecipeListItem } from '@pantry/contracts';
import { Icon, Input, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ResumeBanner } from '../../cook/components/ResumeBanner';
import { cookStrings } from '../../cook/strings';
import { LibrarySortSheet, type RecipeSort } from '../sheets/LibrarySortSheet';
import { NewAskSheet } from '../sheets/NewAskSheet';
import { libraryStrings } from '../strings';
import { CookNewButton } from './CookNewButton';
import { LibraryFilters } from './LibraryFilters';
import { LibraryHeader } from './LibraryHeader';
import { RecentlyGenerated } from './RecentlyGenerated';
import { RecipeListCard } from './RecipeListCard';

function sortRecipes(list: readonly RecipeListItem[], sort: RecipeSort): RecipeListItem[] {
  const next = [...list];
  if (sort === 'alpha') return next.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'quickest') return next.sort((a, b) => a.timeMinutes - b.timeMinutes);
  return next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const RECENT_LIMIT = 3;

export interface RecipeLibraryScreenProps {
  items: readonly RecipeListItem[];
  activeSession?: CookSession | null;
}

/** Board §03 mobile Cook tab — the recipe library (decision A). */
export function RecipeLibraryScreen({ items, activeSession = null }: RecipeLibraryScreenProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<RecipeLibraryFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<RecipeSort>('recent');
  const [sortOpen, setSortOpen] = useState(false);

  const savedCount = useMemo(() => items.filter((item) => item.favorited).length, [items]);
  const visible = useMemo(() => {
    const base = filter === 'favorites' ? items.filter((item) => item.favorited) : items;
    const q = query.trim().toLowerCase();
    const matched = q === '' ? base : base.filter((item) => item.title.toLowerCase().includes(q));
    return sortRecipes(matched, sort);
  }, [items, filter, query, sort]);
  const recent = useMemo(() => items.slice(0, RECENT_LIMIT), [items]);

  const openRecipe = (id: string): void => {
    router.push(`/${id}`);
  };

  return (
    <View testID="library-screen" style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {activeSession !== null && (
          <ResumeBanner
            recipeTitle={activeSession.recipeTitle}
            meta={cookStrings.resumeStepMeta(activeSession.currentStepIndex + 1, activeSession.totalSteps)}
            onResume={() => {
              router.push('/session');
            }}
          />
        )}
        <LibraryHeader
          savedCount={savedCount}
          onNew={() => {
            setSheetOpen(true);
          }}
          searchActive={searchOpen}
          onToggleSearch={() => {
            setSearchOpen((open) => !open);
          }}
          onOpenSort={() => {
            setSortOpen(true);
          }}
        />
        {searchOpen && (
          <Input
            testID="library-search-input"
            value={query}
            onChangeText={setQuery}
            placeholder={libraryStrings.searchPlaceholder}
            leftIcon={<Icon name="Search" size={15} color={tokens.fgSubtle} />}
          />
        )}
        <LibraryFilters active={filter} onChange={setFilter} />
        <View style={styles.list}>
          {visible.map((item) => (
            <RecipeListCard key={item.id} item={item} onPress={openRecipe} />
          ))}
          {visible.length === 0 && query.trim() !== '' && (
            <Text style={styles.noMatches}>{libraryStrings.noMatches}</Text>
          )}
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

      <LibrarySortSheet
        open={sortOpen}
        value={sort}
        onSelect={setSort}
        onClose={() => {
          setSortOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 120, gap: 18 },
  list: { gap: 8 },
  noMatches: { fontFamily: fonts.sans, fontSize: 14, color: tokens.fgSubtle, paddingVertical: 16, textAlign: 'center' },
});
