import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
  const [thumbAnim] = useState(() => new Animated.Value(value));
  const draggingRef = useRef(false);

  // Absolute page-x of the track's left edge, captured at touch-down. Drag math
  // uses page coordinates (not the target-relative `locationX`, which flips
  // coordinate systems whenever a child slides under the finger) so the value
  // tracks the finger regardless of which node is the touch target.
  const trackPageXRef = useRef(0);

  // Mirror external `value` changes (a11y step, programmatic set) onto the
  // thumb — but never mid-drag, where a stale round-tripped prop would fight
  // the imperative updates and stutter.
  useEffect(() => {
    if (!draggingRef.current) {
      thumbAnim.setValue(value);
    }
  }, [value, thumbAnim]);

  const handleTouch = (pageX: number): void => {
    const next = valueFromTouch(pageX - trackPageXRef.current, trackWidth);
    thumbAnim.setValue(next);
    onChange?.(next);
  };

  // translateX in pixels off the measured track width is compositor-only and
  // recomputed only when the width changes — never per drag frame.
  const thumbTranslate = useMemo(
    () =>
      thumbAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [thumbTranslateX(0, trackWidth), thumbTranslateX(100, trackWidth)],
      }),
    [thumbAnim, trackWidth],
  );

  // The gradient Svg is expensive to reconcile; memoizing it by reference keeps
  // react-native-svg from repainting the track on every controlled re-render
  // during a drag (the real source of the stutter).
  const track = useMemo(
    () => (
      <Svg width="100%" height={trackHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            {GRADIENT_STOPS.map((stop) => (
              <Stop key={stop.offset} offset={percent(stop.offset)} stopColor={stop.color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={trackHeight} rx={trackHeight / 2} fill={`url(#${gradientId})`} />
      </Svg>
    ),
    [gradientId, trackHeight],
  );

  // Deterministic vertical centre of the thumb on the track (no `top: '50%'`,
  // whose percentage base shifted the thumb off-centre on device).
  const thumbTop = verticalPadding + trackHeight / 2 - thumbSize / 2;
  const thumb = useMemo(
    () => (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            top: thumbTop,
            marginLeft: -thumbSize / 2,
            transform: [{ translateX: thumbTranslate }],
            boxShadow: thumbShadow,
          },
        ]}
      />
    ),
    [thumbSize, thumbTop, thumbTranslate, thumbShadow],
  );

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
      // Hold the responder for the whole drag: deny an ancestor ScrollView's
      // request to take over when the finger drifts vertically, which would
      // otherwise terminate the gesture mid-slide and freeze the thumb.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event) => {
        draggingRef.current = true;
        // With the thumb non-interactive the down-target is always the track,
        // so page-left = pageX − locationX is the track's true page origin.
        const { pageX, locationX } = event.nativeEvent;
        trackPageXRef.current = pageX - locationX;
        handleTouch(pageX);
      }}
      onResponderMove={(event) => {
        handleTouch(event.nativeEvent.pageX);
      }}
      onResponderRelease={() => {
        draggingRef.current = false;
      }}
      onResponderTerminate={() => {
        draggingRef.current = false;
      }}
      style={{ paddingVertical: verticalPadding }}
    >
      {track}
      {thumb}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    position: 'absolute',
    borderRadius: tokens.rPill,
    backgroundColor: tokens.bgRaised,
    borderWidth: 1.5,
    borderColor: tokens.fg,
  },
});
