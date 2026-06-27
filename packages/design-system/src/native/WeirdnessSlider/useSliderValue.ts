import { useCallback, useEffect, useRef, useState } from 'react';

/** Upward `onChange` fires at most this often during a drag (final value always delivered). */
const THROTTLE_MS = 100;
/** External `value` changes within this window of a user drag are ignored as stale. */
const INTERACTION_GUARD_MS = 250;

export interface SliderValue {
  /** Live value for local display (thumb + vocabulary word) — updates every frame. */
  live: number;
  /** Call on each drag frame; updates `live` immediately, throttles `onChange` upward. */
  handleChange: (value: number) => void;
}

/**
 * Live slider value with a throttled upward `onChange`.
 *
 * The mobile slider stutter came from the controlled value round-tripping
 * through parent state on every touch frame, re-rendering the whole screen and
 * saturating the JS thread. This hook keeps the displayed value local (cheap
 * re-renders of just the slider) and only notifies the parent at most every
 * `THROTTLE_MS`, always delivering the final value via a trailing call.
 */
export function useSliderValue(
  value: number,
  onChange?: (value: number) => void,
): SliderValue {
  const [live, setLive] = useState(value);
  const pendingRef = useRef<number | null>(null);
  const lastEmitRef = useRef(0);
  const lastInteractionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Adopt external value changes, but not while the user is actively dragging —
  // a throttled, momentarily-stale parent value must not yank the thumb back.
  useEffect(() => {
    if (Date.now() - lastInteractionRef.current > INTERACTION_GUARD_MS) {
      setLive(value);
    }
  }, [value]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleChange = useCallback((next: number): void => {
    lastInteractionRef.current = Date.now();
    setLive(next);
    pendingRef.current = next;
    const wait = THROTTLE_MS - (Date.now() - lastEmitRef.current);
    if (wait <= 0) {
      lastEmitRef.current = Date.now();
      pendingRef.current = null;
      onChangeRef.current?.(next);
      return;
    }
    if (timerRef.current === null) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        lastEmitRef.current = Date.now();
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending !== null) onChangeRef.current?.(pending);
      }, wait);
    }
  }, []);

  return { live, handleChange };
}
