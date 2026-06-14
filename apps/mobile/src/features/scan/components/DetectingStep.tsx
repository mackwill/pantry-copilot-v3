import { StyleSheet, Text, View } from 'react-native';
import { scanStrings } from '../strings';
import { DetectingOverlay } from './DetectingOverlay';
import { scanTheme } from './scanTheme';

/** Frozen progress bars matching the board (mock provider makes this deterministic). */
const PROGRESS = [1, 1, 1, 1, 1, 0.5, 0.3, 0.2];
const FOUND_SO_FAR = 7;

interface DetectingStepProps {
  testID?: string;
}

export function DetectingStep({ testID }: DetectingStepProps) {
  return (
    <View testID={testID} style={styles.root}>
      <DetectingOverlay />
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.spinner} />
          <Text style={styles.eyebrow}>{scanStrings.detecting.eyebrow}</Text>
        </View>
        <Text style={styles.headline}>{scanStrings.detecting.progress(FOUND_SO_FAR)}</Text>
        <View style={styles.bars}>
          {PROGRESS.map((v, i) => (
            <View key={i} style={[styles.bar, { opacity: v }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: scanTheme.bg, paddingTop: 54 },
  card: {
    position: 'absolute', bottom: 72, left: 20, right: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 18,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  spinner: { width: 18, height: 18, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: scanTheme.reticle },
  eyebrow: { color: scanTheme.reticle, fontSize: 12, fontWeight: '500', letterSpacing: 1.6, textTransform: 'uppercase' },
  headline: { color: scanTheme.textOnDark, fontSize: 22 },
  bars: { flexDirection: 'row', gap: 4, marginTop: 12 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: scanTheme.reticle },
});
