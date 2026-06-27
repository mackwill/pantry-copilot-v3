import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSliderValue } from './useSliderValue.js';

describe('useSliderValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes the initial value as live', () => {
    const { result } = renderHook(() => useSliderValue(30));
    expect(result.current.live).toBe(30);
  });

  it('updates live immediately on every change', () => {
    const { result } = renderHook(() => useSliderValue(30));
    act(() => {
      result.current.handleChange(42);
    });
    expect(result.current.live).toBe(42);
  });

  it('emits the first change immediately (leading edge)', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSliderValue(30, onChange));
    act(() => {
      result.current.handleChange(20);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('coalesces rapid changes into one trailing emit with the final value', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useSliderValue(30, onChange));
    act(() => {
      result.current.handleChange(20); // leading
      result.current.handleChange(21);
      result.current.handleChange(22);
    });
    expect(onChange).toHaveBeenCalledTimes(1); // only the leading emit so far
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(22);
  });

  it('adopts external value changes when the user is not interacting', () => {
    const { result, rerender } = renderHook(({ v }) => useSliderValue(v), {
      initialProps: { v: 30 },
    });
    rerender({ v: 70 });
    expect(result.current.live).toBe(70);
  });
});
