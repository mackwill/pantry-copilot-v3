import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';
import { Icon } from '../Icon/Icon.js';
import { SliderTrack } from '../WeirdnessSlider/SliderTrack.js';
import { useSliderValue } from '../WeirdnessSlider/useSliderValue.js';
import { weirdnessLabel } from '../WeirdnessSlider/weirdness.js';

export type WeirdnessControlSize = 'sm' | 'md';

export interface WeirdnessControlProps {
  value?: number;
  onChange?: ((value: number) => void) | undefined;
  size?: WeirdnessControlSize;
}

// One-line weirdness control that lives inside prompt footers:
// label · gradient track · current vocabulary word.
export function WeirdnessControl({ value = 30, onChange, size = 'md' }: WeirdnessControlProps) {
  const sm = size === 'sm';
  const { live, handleChange } = useSliderValue(value, onChange);
  return (
    <View style={[styles.row, sm ? styles.rowSm : null]}>
      <View style={styles.labelGroup}>
        <Icon name="SlidersHorizontal" size={sm ? 12 : 13} color={tokens.fgMuted} />
        <Text style={[styles.label, sm ? styles.labelSm : null]}>Weirdness</Text>
      </View>
      <View style={[styles.trackWrap, sm ? styles.trackWrapSm : null]}>
        <SliderTrack
          value={live}
          onChange={handleChange}
          label="Weirdness"
          trackHeight={6}
          thumbSize={sm ? 16 : 18}
          verticalPadding={7}
          thumbShadow="0 1px 4px rgba(14,18,14,0.25)"
        />
      </View>
      <Text style={[styles.current, sm ? styles.currentSm : null]} numberOfLines={1}>
        {weirdnessLabel(live)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowSm: { gap: 9 },
  labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  label: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: tokens.fgMuted,
  },
  labelSm: { fontSize: 9, letterSpacing: 1.08 },
  trackWrap: { flex: 1, minWidth: 110 },
  trackWrapSm: { minWidth: 72 },
  current: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 16,
    color: tokens.fg,
    flexShrink: 0,
    minWidth: 86,
    textAlign: 'right',
  },
  currentSm: { fontSize: 14, minWidth: 60 },
});
