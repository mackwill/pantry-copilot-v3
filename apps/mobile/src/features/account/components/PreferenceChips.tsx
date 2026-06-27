import { Button, Input, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { accountStrings } from '../strings';
import { tagLabel } from '../preferenceLabels';

const s = accountStrings.diet;

export interface PreferenceChipsProps {
  heading: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  testID: string;
}

/** A toggle-chip multiselect with a free-text custom-tag adder (mobile). */
export function PreferenceChips({ heading, options, value, onChange, testID }: PreferenceChipsProps) {
  const [custom, setCustom] = useState('');
  const chips = [...options, ...value.filter((tag) => !options.includes(tag))];

  const toggle = (tag: string): void => {
    onChange(value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]);
  };

  const addCustom = (): void => {
    const tag = custom.trim().toLowerCase();
    if (tag.length === 0 || value.includes(tag)) {
      setCustom('');
      return;
    }
    onChange([...value, tag]);
    setCustom('');
  };

  return (
    <View style={styles.section} testID={testID}>
      <Text style={styles.heading}>{heading}</Text>
      <View style={styles.chipRow}>
        {chips.map((tag) => {
          const active = value.includes(tag);
          return (
            <Pressable
              key={tag}
              testID={`${testID}-chip-${tag}`}
              onPress={() => {
                toggle(tag);
              }}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{tagLabel(tag)}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.customRow}>
        <View style={styles.customInput}>
          <Input testID={`${testID}-custom-input`} value={custom} onChangeText={setCustom} placeholder={s.addPlaceholder} />
        </View>
        <Button kind="secondary" size="sm" onPress={addCustom}>
          {s.add}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  heading: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: tokens.fg, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: tokens.rPill,
    borderWidth: 1,
    borderColor: tokens.line,
    backgroundColor: tokens.bgRaised,
  },
  chipActive: { borderColor: tokens.accent, backgroundColor: tokens.accentSoft },
  chipText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fgMuted },
  chipTextActive: { color: tokens.accent },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customInput: { flex: 1 },
});
