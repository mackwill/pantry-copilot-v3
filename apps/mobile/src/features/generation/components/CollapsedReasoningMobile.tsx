import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { generationStrings } from '../strings';

const s = generationStrings.drafting;

export interface CollapsedReasoningMobileProps {
  elapsed: string;
  toolCount: number;
}

/** Collapsed thinking summary shown above the recipe in §04 drafting / §02 result. */
export function CollapsedReasoningMobile({ elapsed, toolCount }: CollapsedReasoningMobileProps) {
  return (
    <View style={styles.row}>
      <Icon name="Check" size={12} color={tokens.accent} />
      <Text style={styles.label}>{s.thoughtFor(elapsed)}</Text>
      <Text style={styles.meta}>{generationStrings.thinking.toolCount(toolCount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: tokens.bgSunk,
    borderRadius: 10,
  },
  label: { fontFamily: fonts.sans, fontSize: 12, color: tokens.fg },
  meta: { marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
});
