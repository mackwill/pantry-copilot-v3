import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { recipeChatStrings as s } from '../strings';

export interface ApplyBarProps {
  tweakCount: number;
  onRevert: () => void;
  canRevert: boolean;
}

/** Sheet header: sparkle + co-pilot title + tweak count + revert pill (board §✦). */
export function ApplyBar({ tweakCount, onRevert, canRevert }: ApplyBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.sparkle}>
        <Icon name="Sparkles" size={13} color={tokens.accentFg} />
      </View>
      <View style={styles.titleCol}>
        <Text style={styles.title}>{s.panelTitle}</Text>
        <Text style={styles.sub}>{s.tweaksLine(tweakCount)}</Text>
      </View>
      <Pressable
        testID="chat-revert"
        style={[styles.revert, canRevert ? null : styles.revertOff]}
        onPress={onRevert}
        disabled={!canRevert}
      >
        <Icon name="RotateCcw" size={11} color={tokens.fgMuted} />
        <Text style={styles.revertText}>{s.revert}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
  },
  sparkle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: tokens.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: { flex: 1 },
  title: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fg },
  sub: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 11, color: tokens.fgMuted },
  revert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.line,
  },
  revertOff: { opacity: 0.4 },
  revertText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '500', color: tokens.fgMuted },
});
