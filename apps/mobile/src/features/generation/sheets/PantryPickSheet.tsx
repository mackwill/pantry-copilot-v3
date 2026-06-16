import type { PantryItem } from '@pantry/contracts';
import { BottomSheet, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { freshnessFor } from '@pantry/utils';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { generationStrings } from '../strings';
import { ExpiringTapRow } from '../components/ExpiringTapRow';

export interface PantryPickSheetProps {
  open: boolean;
  items: PantryItem[];
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
  selectedNames: string[];
  onClose: () => void;
}

type Filter = (typeof generationStrings.filters)[number];

function matchesFilter(item: PantryItem, filter: Filter): boolean {
  switch (filter) {
    case 'All':
      return true;
    case 'Expiring':
      return freshnessFor(item.bestBy).tone !== 'success';
    case 'Fridge':
      return item.location.startsWith('fridge');
    case 'Pantry':
      return item.location.startsWith('pantry') || item.location === 'counter';
    case 'Produce':
      return item.category === 'produce';
    case 'Dairy':
      return item.category === 'dairy';
    default:
      return true;
  }
}

interface Group {
  key: string;
  label: string;
  sub?: string;
  items: PantryItem[];
}

function groupItems(items: PantryItem[]): Group[] {
  const needsUsing: PantryItem[] = [];
  const fridge: PantryItem[] = [];
  const pantry: PantryItem[] = [];
  for (const item of items) {
    if (freshnessFor(item.bestBy).tone !== 'success') {
      needsUsing.push(item);
    } else if (item.location.startsWith('fridge') || item.location === 'freezer') {
      fridge.push(item);
    } else {
      pantry.push(item);
    }
  }
  return [
    { key: 'needs', label: generationStrings.sheet.needsUsing, sub: generationStrings.sheet.needsUsingSub, items: needsUsing },
    { key: 'fridge', label: generationStrings.sheet.fridge, items: fridge },
    { key: 'pantry', label: generationStrings.sheet.pantry, items: pantry },
  ].filter((g) => g.items.length > 0);
}

/** §01 browse-pantry — full multiselect pantry picker on the canonical BottomSheet. */
export function PantryPickSheet({ open, items, isSelected, onToggle, selectedNames, onClose }: PantryPickSheetProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (item) => matchesFilter(item, filter) && (q.length === 0 || item.name.toLowerCase().includes(q)),
    );
  }, [items, filter, query]);

  const groups = useMemo(() => groupItems(visible), [visible]);
  const selectedCount = selectedNames.length;

  const footer = (
    <View style={styles.footer}>
      <View style={styles.footerText}>
        <Text style={styles.footerCount}>{generationStrings.sheet.selectedCount(selectedCount)}</Text>
        {selectedNames.length > 0 ? (
          <Text style={styles.footerNames} numberOfLines={1}>
            {selectedNames.join(', ')}
          </Text>
        ) : null}
      </View>
      <Pressable testID="add-to-prompt" onPress={onClose} style={styles.add}>
        <Text style={styles.addText}>{generationStrings.sheet.addToPrompt}</Text>
        <Icon name="ArrowRight" size={13} color={tokens.accentFg} />
      </Pressable>
    </View>
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow={generationStrings.sheet.eyebrow}
      title={`${generationStrings.sheet.titleLead}${generationStrings.sheet.titleAccent}`}
      height={620}
      footer={footer}
    >
      <View testID="pantry-pick-sheet" style={styles.search}>
        <Icon name="Search" size={14} color={tokens.fgSubtle} />
        <TextField value={query} onChangeText={setQuery} />
        <Text style={styles.searchCount}>{generationStrings.sheet.itemCount(items.length)}</Text>
      </View>

      <View style={styles.filters}>
        {generationStrings.filters.map((f) => {
          const on = f === filter;
          return (
            <Pressable
              key={f}
              testID={`pantry-filter-${f.toLowerCase()}`}
              onPress={() => {
                setFilter(f);
              }}
              style={[styles.pill, on ? styles.pillOn : null]}
            >
              <Text style={[styles.pillText, on ? styles.pillTextOn : null]}>{f}</Text>
            </Pressable>
          );
        })}
      </View>

      {groups.map((group) => (
        <View key={group.key}>
          <View style={styles.groupHeader}>
            <Eyebrow>{group.label}</Eyebrow>
            {group.sub !== undefined ? <Text style={styles.groupSub}>{group.sub}</Text> : null}
          </View>
          {group.items.map((item, i) => (
            <ExpiringTapRow
              key={item.id}
              item={item}
              selected={isSelected(item.id)}
              isLast={i === group.items.length - 1}
              onToggle={onToggle}
            />
          ))}
        </View>
      ))}
    </BottomSheet>
  );
}

function TextField({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return (
    <TextInput
      testID="pantry-search"
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={generationStrings.sheet.searchPlaceholder}
      placeholderTextColor={tokens.fgSubtle}
    />
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: tokens.fg, padding: 0 },
  searchCount: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 20, paddingVertical: 10 },
  pill: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1, borderColor: tokens.line },
  pillOn: { backgroundColor: tokens.bgInverse, borderColor: tokens.bgInverse },
  pillText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: tokens.fgMuted },
  pillTextOn: { color: tokens.bg },
  groupHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  groupSub: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerText: { flex: 1, minWidth: 0 },
  footerCount: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fg },
  footerNames: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle, marginTop: 2 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: tokens.accent,
  },
  addText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: tokens.accentFg },
});
