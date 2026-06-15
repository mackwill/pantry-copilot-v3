import { Eyebrow, Icon, WeirdnessControl, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { generationStrings } from '../strings';

export interface PromptChip {
  id: string;
  label: string;
}

export interface PromptWithChipsProps {
  chips: PromptChip[];
  value: string;
  onChangeText: (value: string) => void;
  weirdness: number;
  onWeirdnessChange: (value: number) => void;
  onRemoveChip: (id: string) => void;
  onSubmit: () => void;
}

/** §01 selecting state — tapped pantry items become removable chips above the note. */
export function PromptWithChips({
  chips,
  value,
  onChangeText,
  weirdness,
  onWeirdnessChange,
  onRemoveChip,
  onSubmit,
}: PromptWithChipsProps) {
  return (
    <View style={styles.card} testID="prompt-with-chips">
      <View style={styles.body}>
        <View style={styles.eyebrowRow}>
          <Icon name="Sparkles" size={13} color={tokens.accent} />
          <Eyebrow color={tokens.accent}>{generationStrings.home.cookingWith}</Eyebrow>
        </View>
        <View style={styles.chips}>
          {chips.map((chip) => (
            <View key={chip.id} style={styles.chip}>
              <Text style={styles.chipText}>{chip.label}</Text>
              <Pressable
                testID={`remove-chip-${chip.id}`}
                onPress={() => {
                  onRemoveChip(chip.id);
                }}
                hitSlop={6}
                style={styles.chipClose}
              >
                <Icon name="X" size={9} color={tokens.accent} />
              </Pressable>
            </View>
          ))}
        </View>
        <TextNote value={value} onChangeText={onChangeText} />
      </View>
      <View style={styles.footer}>
        <View style={styles.weirdRow}>
          <WeirdnessControl value={weirdness} onChange={onWeirdnessChange} size="sm" />
        </View>
        <View style={styles.submitRow}>
          <Text style={styles.ready}>{generationStrings.home.readySummary(chips.length)}</Text>
          <Pressable testID="cook-this" onPress={onSubmit} style={styles.submit}>
            <Text style={styles.submitText}>{generationStrings.home.submit}</Text>
            <Icon name="ArrowRight" size={13} color={tokens.accentFg} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function TextNote({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return (
    <TextInput
      testID="hero-prompt-input"
      style={styles.note}
      value={value}
      onChangeText={onChangeText}
      placeholder={generationStrings.home.notePlaceholder}
      placeholderTextColor={tokens.fgSubtle}
      multiline
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1.5,
    borderColor: tokens.accent,
    borderRadius: 16,
    padding: 4,
  },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, gap: 8 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 11,
    paddingRight: 5,
    borderRadius: 999,
    backgroundColor: tokens.accentSoft,
  },
  chipText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: tokens.accent },
  chipClose: {
    width: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79,107,46,0.18)',
  },
  note: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 21,
    color: tokens.fgSubtle,
    padding: 0,
    minHeight: 24,
  },
  footer: { borderTopWidth: 1, borderTopColor: tokens.line, backgroundColor: tokens.bg, borderRadius: 12 },
  weirdRow: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tokens.line },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingLeft: 14, paddingRight: 10 },
  ready: { flex: 1, fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: tokens.accent,
  },
  submitText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: tokens.accentFg },
});
