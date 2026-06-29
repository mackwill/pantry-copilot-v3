import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../tokens/native.js';
import { fonts } from '../fonts.js';
import { Icon } from '../Icon/Icon.js';
import { SliderTrack } from '../WeirdnessSlider/SliderTrack.js';
import { useSliderValue } from '../WeirdnessSlider/useSliderValue.js';
import { WEIRDNESS_LABELS, weirdnessLabel } from '../WeirdnessSlider/weirdness.js';

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
      {/* Fixed-width slot: hidden sizers reserve the widest word's width so the
          flex track never re-measures when the word changes (which jolted the
          thumb mid-drag). The live word is overlaid on top, right-aligned. */}
      <View style={[styles.currentSlot, sm ? styles.currentSlotSm : null]}>
        {WEIRDNESS_LABELS.map((word) => (
          <Text
            key={word}
            aria-hidden
            style={[styles.current, sm ? styles.currentSm : null, styles.currentSizer]}
          >
            {word}
          </Text>
        ))}
        <Text
          style={[styles.current, sm ? styles.currentSm : null, styles.currentLive]}
          numberOfLines={1}
        >
          {weirdnessLabel(live)}
        </Text>
      </View>
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
  currentSlot: { flexShrink: 0, height: 22, overflow: 'hidden' },
  currentSlotSm: { height: 18 },
  current: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
    color: tokens.fg,
    textAlign: 'right',
  },
  currentSm: { fontSize: 14, lineHeight: 18 },
  // Sizers are invisible but in-flow, so the slot's width is the widest word.
  currentSizer: { opacity: 0 },
  // The live word overlays the slot, vertically centred via its line height.
  currentLive: { position: 'absolute', top: 0, left: 0, right: 0 },
});
