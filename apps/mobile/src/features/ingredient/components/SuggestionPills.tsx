import { Icon, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface SuggestionPillsProps {
  suggestions: readonly string[];
  onPick: (name: string) => void;
}

/** Quick name suggestions; each press fills the name field. */
export function SuggestionPills({ suggestions, onPick }: SuggestionPillsProps) {
  return (
    <View style={styles.row}>
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion}
          onPress={() => {
            onPick(suggestion);
          }}
        >
          <Pill tone="outline" style={styles.pill}>
            <View style={styles.inner}>
              <Icon name="Plus" size={11} color={tokens.fgMuted} />
              <Text style={styles.label}>{suggestion}</Text>
            </View>
          </Pill>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.fgMuted,
  },
});
