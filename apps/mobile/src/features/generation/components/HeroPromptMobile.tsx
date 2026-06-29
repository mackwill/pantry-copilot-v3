import { Icon, WeirdnessSlider, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { generationStrings } from '../strings';

export interface HeroPromptMobileProps {
  value: string;
  onChangeText: (value: string) => void;
  weirdness: number;
  onWeirdnessChange: (value: number) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

/** §01 default Home prompt — display textarea, suggestion chips, weirdness + Cook. */
export function HeroPromptMobile({
  value,
  onChangeText,
  weirdness,
  onWeirdnessChange,
  onSubmit,
  canSubmit,
}: HeroPromptMobileProps) {
  return (
    <View style={styles.card}>
      <View style={styles.body}>
        <TextInput
          testID="hero-prompt-input"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={generationStrings.home.placeholder}
          placeholderTextColor={tokens.fgSubtle}
          multiline
          textAlignVertical="top"
        />
        <View style={styles.chips}>
          {generationStrings.home.suggestions.map((s) => (
            <Pressable
              key={s}
              style={styles.chip}
              onPress={() => {
                onChangeText(value.length > 0 ? `${value} ${s}` : s);
              }}
            >
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.weirdRow}>
          <WeirdnessSlider value={weirdness} onChange={onWeirdnessChange} compact />
        </View>
        <View style={styles.submitRow}>
          <View style={styles.spacer} />
          <Pressable
            testID="cook-this"
            disabled={!canSubmit}
            onPress={onSubmit}
            style={[styles.submit, canSubmit ? null : styles.submitDisabled]}
          >
            <Text style={styles.submitText}>{generationStrings.home.submit}</Text>
            <Icon name="ArrowRight" size={13} color={tokens.accentFg} />
          </Pressable>
        </View>
      </View>
    </View>
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
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, gap: 10 },
  input: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: tokens.fg,
    minHeight: 64,
    padding: 0,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.line,
  },
  chipText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: tokens.fgMuted },
  footer: { borderTopWidth: 1, borderTopColor: tokens.line, backgroundColor: tokens.bg, borderRadius: 12 },
  weirdRow: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tokens.line },
  submitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingLeft: 14, paddingRight: 10 },
  spacer: { flex: 1 },
  submit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: tokens.accent,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: tokens.accentFg },
});
