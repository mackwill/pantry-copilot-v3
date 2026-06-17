import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CHAT_SUGGESTIONS, recipeChatStrings as s } from '../strings';

export interface ChatComposerProps {
  onSend: (prompt: string) => void;
  disabled: boolean;
  initialPrompt?: string;
}

/** Suggestion chips + input + send (board §✦ ChatInput). */
export function ChatComposer({ onSend, disabled, initialPrompt = '' }: ChatComposerProps) {
  const [value, setValue] = useState(initialPrompt);
  const canSend = value.trim().length > 0 && !disabled;

  const submit = (): void => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };

  return (
    <View>
      <View style={styles.chips}>
        {CHAT_SUGGESTIONS.slice(0, 3).map((chip) => (
          <Pressable
            key={chip.label}
            style={styles.chip}
            onPress={() => {
              setValue(chip.prompt);
            }}
          >
            <Icon name={chip.icon} size={12} color={tokens.accent} />
            <Text style={styles.chipText}>{chip.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          testID="chat-input"
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={s.composerPlaceholder}
          placeholderTextColor={tokens.fgSubtle}
        />
        <Pressable
          testID="chat-send"
          style={[styles.sendBtn, canSend ? null : styles.sendBtnOff]}
          onPress={submit}
          disabled={!canSend}
        >
          <Icon name="ArrowUp" size={14} color={tokens.accentFg} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.bgRaised,
    borderWidth: 1.5,
    borderColor: tokens.line,
    borderRadius: 14,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
  },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: tokens.fg, padding: 0 },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: tokens.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.4 },
});
