import { useEffect, useId, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { tokens } from '../../tokens/native.js';
import { parseGradientStops, thumbTranslateX, valueFromTouch } from './weirdness.js';

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
  const [trackWidth, setTrackWidth] = useState(0);

  // The thumb glides off this Animated.Value, set imperatively from the touch
  // — its paint never waits on the controlled `value` prop round-tripping back
  // through parent state, so fast drags stay smooth regardless of re-renders.
  // Lazy `useState` (not a ref) keeps the instance stable while staying
  // readable during render for the interpolation below.
  const [thumbAnim] = useState(() => new Animated.Value(value));
  const draggingRef = useRef(false);

  // Mirror external `value` changes (a11y step, programmatic set) onto the
  // thumb — but never mid-drag, where a stale round-tripped prop would fight
  // the imperative updates and stutter.
  useEffect(() => {
    if (!draggingRef.current) {
      thumbAnim.setValue(value);
    }
  }, [value, thumbAnim]);

  const handleTouch = (x: number) => {
    const next = valueFromTouch(x, trackWidth);
    thumbAnim.setValue(next);
    onChange?.(next);
  };

  // translateX in pixels off the measured track width is compositor-only,
  // unlike animating `left` as a percentage string which forced a JS-thread
  // layout pass per frame and stuttered during drags.
  const thumbTranslate = thumbAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [thumbTranslateX(0, trackWidth), thumbTranslateX(100, trackWidth)],
  });

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
        setTrackWidth(event.nativeEvent.layout.width);
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => {
        draggingRef.current = true;
        handleTouch(event.nativeEvent.locationX);
      }}
      onResponderMove={(event) => {
        handleTouch(event.nativeEvent.locationX);
      }}
      onResponderRelease={() => {
        draggingRef.current = false;
      }}
      onResponderTerminate={() => {
        draggingRef.current = false;
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
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            left: 0,
            marginLeft: -thumbSize / 2,
            marginTop: -thumbSize / 2,
            transform: [{ translateX: thumbTranslate }],
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
