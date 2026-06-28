import type { PantryCategory, PantryItem } from '@pantry/contracts';
import { Icon, Eyebrow, Input, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { pantryStrings } from '../strings';
import { useCookSelection } from '../useCookSelection';
import { usePantry } from '../usePantry';
import { CookTray } from './CookTray';
import { PantryFilterSheet } from './PantryFilterSheet';
import { PantrySection } from './PantrySection';

const MAX_CHIPS = 3;

export function PantryScreen() {
  const { needsUsing, fresh, expiringCount, items } = usePantry();
  const selection = useCookSelection();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [category, setCategory] = useState<PantryCategory | null>(null);

  const matches = (item: PantryItem): boolean => {
    const byQuery = query.trim() === '' || item.name.toLowerCase().includes(query.trim().toLowerCase());
    const byCategory = category === null || item.category === category;
    return byQuery && byCategory;
  };
  const filteredNeedsUsing = needsUsing.filter(matches);
  const filteredFresh = fresh.filter(matches);
  const hasMatches = filteredNeedsUsing.length > 0 || filteredFresh.length > 0;

  const chipLabels = selection
    .selectedItems(items)
    .slice(0, MAX_CHIPS)
    .map((item) => item.name.toLowerCase());

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.eyebrowRow}>
            <Eyebrow>{pantryStrings.eyebrow}</Eyebrow>
            <View style={styles.icons}>
              <Pressable
                testID="pantry-search-toggle"
                onPress={() => {
                  setSearchOpen((open) => !open);
                }}
                hitSlop={8}
              >
                <Icon name="Search" size={18} color={searchOpen ? tokens.accent : tokens.fgMuted} />
              </Pressable>
              <Pressable
                testID="pantry-filter-toggle"
                onPress={() => {
                  setFilterOpen(true);
                }}
                hitSlop={8}
              >
                <Icon name="SlidersHorizontal" size={18} color={category === null ? tokens.fgMuted : tokens.accent} />
              </Pressable>
              <Pressable
                testID="add-ingredient-button"
                onPress={() => {
                  router.push('/add-ingredient');
                }}
                hitSlop={8}
              >
                <Icon name="Plus" size={18} color={tokens.fgMuted} />
              </Pressable>
            </View>
          </View>
          <Text style={styles.title}>{pantryStrings.title}</Text>
          <Text style={styles.subtitle}>
            {pantryStrings.subtitleLead}
            <Text style={styles.subtitleCount}>{pantryStrings.expiringSuffix(expiringCount)}</Text>
          </Text>
        </View>

        {searchOpen && (
          <View style={styles.searchRow}>
            <Input
              testID="pantry-search-input"
              value={query}
              onChangeText={setQuery}
              placeholder={pantryStrings.searchPlaceholder}
              leftIcon={<Icon name="Search" size={15} color={tokens.fgSubtle} />}
            />
          </View>
        )}

        <PantrySection
          title={pantryStrings.needsUsing}
          items={filteredNeedsUsing}
          isSelected={selection.isSelected}
          onToggle={selection.toggle}
        />
        <PantrySection
          title={pantryStrings.fresh}
          items={filteredFresh}
          isSelected={selection.isSelected}
          onToggle={selection.toggle}
        />
        {!hasMatches && <Text style={styles.noMatches}>{pantryStrings.noMatches}</Text>}
      </ScrollView>

      <PantryFilterSheet
        open={filterOpen}
        value={category}
        onSelect={setCategory}
        onClose={() => {
          setFilterOpen(false);
        }}
      />

      {selection.count > 0 ? (
        <CookTray
          count={selection.count}
          chipLabels={chipLabels}
          onCook={() => {
            const ids = selection.selectedItems(items).map((item) => item.id);
            router.push({ pathname: '/generate', params: { items: ids.join(',') } });
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bg,
    paddingTop: 54,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 130,
    gap: 24,
  },
  header: {
    gap: 10,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icons: {
    flexDirection: 'row',
    gap: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: tokens.fg,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: tokens.fgMuted,
  },
  subtitleCount: {
    color: tokens.warning,
  },
  searchRow: {
    marginTop: 4,
  },
  noMatches: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: tokens.fgSubtle,
    paddingVertical: 24,
    textAlign: 'center',
  },
});
