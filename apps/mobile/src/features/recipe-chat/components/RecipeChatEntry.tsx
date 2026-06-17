import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CHAT_SUGGESTIONS, recipeChatStrings as s } from '../strings';

export interface RecipeChatEntryProps {
  onOpen: (prompt?: string) => void;
}

/** Accent-soft hint card under the summary with suggestion chips (board §✦). */
export function RecipeChatEntry({ onOpen }: RecipeChatEntryProps) {
  return (
    <View testID="recipe-chat-hint" style={styles.card}>
      <View style={styles.head}>
        <Icon name="Sparkles" size={13} color={tokens.accent} />
        <Text style={styles.lead}>{s.entryTitle}</Text>
      </View>
      <View style={styles.chips}>
        {CHAT_SUGGESTIONS.map((chip) => (
          <Pressable
            key={chip.label}
            style={styles.chip}
            onPress={() => {
              onOpen(chip.prompt);
            }}
          >
            <Icon name={chip.icon} size={12} color={tokens.accent} />
            <Text style={styles.chipText}>{chip.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.accentSoft,
    borderWidth: 1,
    borderColor: tokens.accentSoft,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  lead: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 14, color: tokens.fg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.lineStrong,
  },
  chipText: { fontFamily: fonts.sans, fontSize: 12, color: tokens.fg },
});
