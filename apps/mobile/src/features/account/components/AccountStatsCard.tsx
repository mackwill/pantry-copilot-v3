import { Eyebrow, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { accountStrings } from '../strings';

export function AccountStatsCard() {
  return (
    <View style={styles.card}>
      <Eyebrow style={styles.eyebrow}>{accountStrings.statsEyebrow}</Eyebrow>
      <View style={styles.grid}>
        {accountStrings.stats.map(([value, label]) => (
          <View key={label} style={styles.cell}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rLg,
    padding: 16,
    marginBottom: 24,
  },
  eyebrow: {
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: tokens.fg,
    letterSpacing: 24 * -0.025,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: tokens.fgSubtle,
  },
});
