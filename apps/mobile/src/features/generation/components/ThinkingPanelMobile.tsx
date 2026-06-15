import { Eyebrow, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import type { TranscriptEntry } from '../useGeneration';
import { generationStrings } from '../strings';

const s = generationStrings.thinking;

export interface ThinkingPanelMobileProps {
  transcript: readonly TranscriptEntry[];
  toolCount: number;
}

/** §04 condensed Thinking — pulsing header + interleaved prose/tool stream. */
export function ThinkingPanelMobile({ transcript, toolCount }: ThinkingPanelMobileProps) {
  return (
    <View style={styles.wrap} testID="thinking-panel">
      <View style={styles.header}>
        <View style={styles.dot} />
        <Eyebrow color={tokens.accent}>{s.header}</Eyebrow>
        <Text style={styles.meta}>{s.toolCount(toolCount)}</Text>
      </View>
      <View style={styles.stream} testID="tool-events">
        {transcript.map((entry, index) =>
          entry.kind === 'prose' ? (
            <Text key={`prose-${String(index)}`} style={styles.prose}>
              {entry.text}
            </Text>
          ) : (
            <View key={entry.tool.id} style={styles.toolRow}>
              <Text style={styles.toolBullet}>{'›'}</Text>
              <Text style={styles.toolText}>
                <Text style={styles.toolName}>{entry.tool.display}</Text>
                {entry.tool.result !== null ? (
                  <Text style={styles.toolResult}>{`  →  ${entry.tool.result}`}</Text>
                ) : null}
              </Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: tokens.accent },
  meta: { marginLeft: 'auto', fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  stream: { gap: 12 },
  prose: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 15, lineHeight: 23, color: tokens.fgMuted },
  toolRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  toolBullet: { fontFamily: fonts.mono, fontSize: 12, color: tokens.accent },
  toolText: { flex: 1, fontFamily: fonts.mono, fontSize: 12, lineHeight: 18, color: tokens.fg },
  toolName: { color: tokens.fg },
  toolResult: { color: tokens.fgSubtle },
});
