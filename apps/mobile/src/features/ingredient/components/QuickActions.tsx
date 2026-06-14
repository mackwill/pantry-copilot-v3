import { Icon, type IconName, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { formStrings } from '../strings';

/** Static three-card shortcut row (Scan / Receipt / Speak). Non-functional this milestone. */
export function QuickActions() {
  return (
    <View style={styles.grid}>
      {formStrings.quickActions.map((action) => (
        <View key={action.label} style={styles.card}>
          <Icon name={action.icon as IconName} size={20} color={tokens.accent} />
          <Text style={styles.label}>{action.label}</Text>
        </View>
      ))}
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
