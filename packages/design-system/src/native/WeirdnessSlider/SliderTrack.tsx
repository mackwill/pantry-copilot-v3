import { useId, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { tokens } from '../../tokens/native.js';
import { parseGradientStops, valueFromTouch } from './weirdness.js';

const GRADIENT_STOPS = parseGradientStops(tokens.weirdGradient);
const A11Y_STEP = 5;

function percent(value: number): `${number}%` {
  // restrict-template-expressions bans numbers in templates; the cast is sound.
  return `${String(value)}%` as `${number}%`;
}

export interface SliderTrackProps {
  value: number;
  onChange?: ((value: number) => void) | undefined;
  label: string;
  trackHeight: number;
  thumbSize: number;
  verticalPadding: number;
  thumbShadow: string;
}

/** Gradient track + thumb shared by WeirdnessSlider and WeirdnessControl. */
export function SliderTrack({
  value,
  onChange,
  label,
  trackHeight,
  thumbSize,
  verticalPadding,
  thumbShadow,
}: SliderTrackProps) {
  const gradientId = useId();
  const trackWidthRef = useRef(0);

  const handleTouch = (x: number) => {
    onChange?.(valueFromTouch(x, trackWidthRef.current));
  };

  return (
    <View
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const delta = event.nativeEvent.actionName === 'increment' ? A11Y_STEP : -A11Y_STEP;
        onChange?.(Math.min(100, Math.max(0, value + delta)));
      }}
      onLayout={(event) => {
        trackWidthRef.current = event.nativeEvent.layout.width;
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        handleTouch(event.nativeEvent.locationX);
      }}
      onResponderMove={(event) => {
        handleTouch(event.nativeEvent.locationX);
      }}
      style={{ paddingVertical: verticalPadding }}
    >
      <Svg width="100%" height={trackHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            {GRADIENT_STOPS.map((stop) => (
              <Stop key={stop.offset} offset={percent(stop.offset)} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect
          width="100%"
          height={trackHeight}
          rx={trackHeight / 2}
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            left: percent(value),
            marginLeft: -thumbSize / 2,
            marginTop: -thumbSize / 2,
            boxShadow: thumbShadow,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    position: 'absolute',
    top: '50%',
    borderRadius: tokens.rPill,
    backgroundColor: tokens.bgRaised,
    borderWidth: 1.5,
    borderColor: tokens.fg,
  },
});
