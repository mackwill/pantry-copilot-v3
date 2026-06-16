import { BottomSheet, Button, Eyebrow, Icon, WeirdnessSlider, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { libraryStrings } from '../strings';

const s = libraryStrings.newAsk;
const DEFAULT_WEIRDNESS = 38;

export interface NewAskSheetProps {
  open: boolean;
  onClose: () => void;
  /** Reuses the M4 generate flow — navigate with the typed prompt + weirdness. */
  onCook: (prompt: string, weirdness: number) => void;
}

/** Board §03 "new-tapped" — prompt + weirdness + chips on the canonical BottomSheet. */
export function NewAskSheet({ open, onClose, onCook }: NewAskSheetProps) {
  const [prompt, setPrompt] = useState('');
  const [weirdness, setWeirdness] = useState(DEFAULT_WEIRDNESS);

  const addChip = (chip: string): void => {
    setPrompt((prev) => (prev.trim().length === 0 ? chip : `${prev.trim()}, ${chip}`));
  };

  const cook = (): void => {
    const text = prompt.trim();
    if (text.length === 0) return;
    onCook(text, weirdness);
  };

  const footer = (
    <View style={styles.footer}>
      <Pressable style={styles.mic}>
        <Icon name="Mic" size={16} color={tokens.fgMuted} />
      </Pressable>
      <Text style={styles.hint}>{s.footerHint}</Text>
      <Button kind="primary" size="md" onPress={cook} rightIcon={<Icon name="ArrowRight" size={14} color={tokens.accentFg} />}>
        {s.cookThis}
      </Button>
    </View>
  );

  return (
    <BottomSheet open={open} onClose={onClose} eyebrow={s.eyebrow} title={s.title} height={520} footer={footer}>
      <View testID="new-ask-sheet" style={styles.promptWrap}>
        <TextInput
          testID="new-ask-input"
          style={styles.prompt}
          value={prompt}
          onChangeText={setPrompt}
          placeholder={s.placeholder}
          placeholderTextColor={tokens.fgSubtle}
          multiline
        />
      </View>

      <View style={styles.weirdBand}>
        <WeirdnessSlider value={weirdness} onChange={setWeirdness} />
      </View>

      <View style={styles.tryWrap}>
        <Eyebrow>{s.tryEyebrow}</Eyebrow>
        <View style={styles.chips}>
          {s.suggestions.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => {
                addChip(chip);
              }}
              style={styles.chip}
            >
              <Icon name="Plus" size={11} color={tokens.fgMuted} />
              <Text style={styles.chipText}>{chip}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  promptWrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  prompt: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 30,
    fontStyle: 'italic',
    color: tokens.fg,
    minHeight: 64,
    padding: 0,
  },
  weirdBand: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: tokens.line,
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
    marginTop: 6,
  },
  tryWrap: { paddingHorizontal: 20, paddingTop: 14, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.lineStrong,
  },
  chipText: { fontFamily: fonts.sans, fontSize: 12, color: tokens.fgMuted },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mic: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.line,
    backgroundColor: tokens.bgRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { flex: 1, fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
});
