import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';
import { SliderTrack } from './SliderTrack.js';
import { WEIRDNESS_LABELS, weirdnessLabel } from './weirdness.js';

export interface WeirdnessSliderProps {
  value: number;
  onChange?: ((value: number) => void) | undefined;
  compact?: boolean;
}

export function WeirdnessSlider({ value, onChange, compact = false }: WeirdnessSliderProps) {
  return (
    <View>
      <View style={[styles.header, compact ? styles.headerCompact : null]}>
        <Text style={styles.eyebrow}>Weirdness</Text>
        <Text style={[styles.current, compact ? styles.currentCompact : null]}>
          {weirdnessLabel(value)}
        </Text>
      </View>
      <SliderTrack
        value={value}
        onChange={onChange}
        label="Weirdness"
        trackHeight={8}
        thumbSize={24}
        verticalPadding={8}
        thumbShadow="0 2px 8px rgba(14,18,14,0.18)"
      />
      {!compact && (
        <View style={styles.vocabRow}>
          {WEIRDNESS_LABELS.map((word) => (
            <Text key={word} style={styles.vocabWord}>
              {word}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  headerCompact: { marginBottom: 10 },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 11,
    letterSpacing: 1.54,
    textTransform: 'uppercase',
    color: tokens.fgSubtle,
  },
  current: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 22,
    color: tokens.fg,
  },
  currentCompact: { fontSize: 18, lineHeight: 18 },
  vocabRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  vocabWord: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 14, color: tokens.fgSubtle },
});
