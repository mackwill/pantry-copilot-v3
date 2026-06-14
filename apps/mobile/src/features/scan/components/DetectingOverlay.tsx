import { StyleSheet, View } from 'react-native';
import { scanTheme } from './scanTheme';

const BOXES = [
  { top: '18%', left: '12%', width: 80, height: 110 },
  { top: '22%', left: '52%', width: 60, height: 80 },
  { top: '48%', left: '20%', width: 70, height: 90 },
  { top: '52%', left: '58%', width: 85, height: 70 },
] as const;

/** Blurred scene + detection boxes + sweep line (frozen for the mock capture). */
export function DetectingOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, styles.scene]} />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />
      {BOXES.map((b, i) => (
        <View key={i} style={[styles.box, { top: b.top, left: b.left, width: b.width, height: b.height }]} />
      ))}
      <View style={styles.sweep} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { top: 54, backgroundColor: '#12160F' },
  scrim: { backgroundColor: scanTheme.scrim },
  box: { position: 'absolute', borderWidth: 1.5, borderColor: scanTheme.reticle, borderRadius: 6, backgroundColor: 'rgba(164,196,107,0.1)' },
  sweep: { position: 'absolute', top: '44%', left: 20, right: 20, height: 2, backgroundColor: scanTheme.reticle },
});
