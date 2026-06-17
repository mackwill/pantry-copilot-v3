import type { RecipeChange } from '@pantry/contracts';
import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { ChangeChip } from './ChangeChip';

export interface ChatBubbleAIProps {
  summary: string;
  changes?: readonly RecipeChange[];
}

/** The co-pilot's reply: sparkle avatar + summary + change chips (board §✦). */
export function ChatBubbleAI({ summary, changes }: ChatBubbleAIProps) {
  const hasChanges = changes !== undefined && changes.length > 0;
  return (
    <View style={styles.row}>
      <View style={styles.sparkle}>
        <Icon name="Sparkles" size={13} color={tokens.accent} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.summary, hasChanges ? styles.summaryGap : null]}>{summary}</Text>
        {hasChanges && (
          <View style={styles.chips}>
            {changes.map((change, i) => (
              <ChangeChip key={`${change.tag}-${String(i)}`} tag={change.tag} text={change.text} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 18, alignItems: 'flex-start' },
  sparkle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: tokens.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: { flex: 1 },
  summary: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: tokens.fg },
  summaryGap: { marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
