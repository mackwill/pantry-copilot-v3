import { Eyebrow, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCookSelection } from '../../pantry/useCookSelection';
import { usePantry } from '../../pantry/usePantry';
import { generationStrings } from '../strings';
import { ExpiringTapList } from './ExpiringTapList';
import { HeroPromptMobile } from './HeroPromptMobile';
import { PromptWithChips } from './PromptWithChips';
import { PantryPickSheet } from '../sheets/PantryPickSheet';

const DEFAULT_WEIRDNESS = 38;

/** §01 Home — hero prompt (or selecting chips), expiring tap-list, recently saved. */
export function HomeScreen() {
  const router = useRouter();
  const { items, needsUsing } = usePantry();
  const selection = useCookSelection();
  const [prompt, setPrompt] = useState('');
  const [weirdness, setWeirdness] = useState(DEFAULT_WEIRDNESS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedItems = selection.selectedItems(items);
  const chips = selectedItems.map((item) => ({ id: item.id, label: item.name.toLowerCase() }));

  const submit = (): void => {
    const note = prompt.trim();
    const chipText = chips.map((c) => c.label).join(', ');
    const text = note.length > 0 ? note : chipText.length > 0 ? `cook with ${chipText}` : '';
    if (text.length === 0) return;
    router.push({
      pathname: '/generate',
      params: { prompt: text, weirdness: String(weirdness), items: selection.selectedIds.join(',') },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Eyebrow>{generationStrings.home.eyebrow}</Eyebrow>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{generationStrings.home.avatarInitials}</Text>
          </View>
        </View>

        <Text style={styles.heading}>
          {generationStrings.home.headingLead}
          {'\n'}
          <Text style={styles.headingAccent}>{generationStrings.home.headingAccent}</Text>
        </Text>

        {selection.count > 0 ? (
          <PromptWithChips
            chips={chips}
            value={prompt}
            onChangeText={setPrompt}
            weirdness={weirdness}
            onWeirdnessChange={setWeirdness}
            onRemoveChip={selection.toggle}
            onSubmit={submit}
          />
        ) : (
          <HeroPromptMobile
            value={prompt}
            onChangeText={setPrompt}
            weirdness={weirdness}
            onWeirdnessChange={setWeirdness}
            onSubmit={submit}
            canSubmit={prompt.trim().length > 0}
          />
        )}

        <ExpiringTapList
          items={needsUsing}
          pantryCount={items.length}
          isSelected={selection.isSelected}
          onToggle={selection.toggle}
          onBrowse={() => {
            setSheetOpen(true);
          }}
        />

        <View style={styles.recent}>
          <View style={styles.recentHeader}>
            <Eyebrow>{generationStrings.home.recentlySaved}</Eyebrow>
            <Text style={styles.recentAll}>{generationStrings.home.recentlySavedAll}</Text>
          </View>
          <Text style={styles.recentEmpty}>{generationStrings.home.recentEmpty}</Text>
        </View>
      </ScrollView>

      <PantryPickSheet
        open={sheetOpen}
        items={items}
        isSelected={selection.isSelected}
        onToggle={selection.toggle}
        selectedNames={selectedItems.map((item) => item.name.toLowerCase())}
        onClose={() => {
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 120, gap: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: tokens.bgInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: tokens.fgOnInverse },
  heading: { fontFamily: fonts.display, fontSize: 32, lineHeight: 34, color: tokens.fg },
  headingAccent: { color: tokens.accent, fontStyle: 'italic' },
  recent: { gap: 8 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  recentAll: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: tokens.accent },
  recentEmpty: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgSubtle },
});
