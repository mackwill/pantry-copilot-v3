import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formStrings } from '../strings';

interface QuickActionsProps {
  onScan: () => void;
}

/** Scan shortcut card above the manual add form (board §09). */
export function QuickActions({ onScan }: QuickActionsProps) {
  return (
    <View style={styles.grid}>
      <Pressable testID="quick-action-scan" style={styles.card} onPress={onScan}>
        <Icon name="ScanLine" size={20} color={tokens.accent} />
        <Text style={styles.label}>{formStrings.quickActions.scan}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  card: {
    flex: 1,
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: tokens.fg,
  },
});
