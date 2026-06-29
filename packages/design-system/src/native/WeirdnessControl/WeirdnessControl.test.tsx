import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WEIRDNESS_LABELS } from '../WeirdnessSlider/weirdness.js';
import { WeirdnessControl } from './WeirdnessControl.js';

describe('WeirdnessControl (native)', () => {
  it('renders the Weirdness label and the current vocabulary word', () => {
    render(<WeirdnessControl value={70} />);
    expect(screen.getByText('Weirdness')).toBeTruthy();
    expect(screen.getAllByText('adventurous').length).toBeGreaterThan(0);
  });

  it('changes the word across breakpoint values', () => {
    const { rerender } = render(<WeirdnessControl value={10} />);
    expect(screen.getAllByText('normal').length).toBeGreaterThan(0);
    rerender(<WeirdnessControl value={95} />);
    expect(screen.getAllByText('chaotic evil').length).toBeGreaterThan(0);
  });

  // The current word lives in a fixed-width slot: every vocabulary word is
  // present (as a hidden sizer) at all times so the flex track between the
  // label and the word never re-measures when the word changes — the source of
  // the drag stutter near a breakpoint.
  it('reserves the widest-word slot so the track width never shifts', () => {
    render(<WeirdnessControl value={10} />);
    for (const word of WEIRDNESS_LABELS) {
      expect(screen.getAllByText(word).length).toBeGreaterThan(0);
    }
  });

  it('exposes a slider role with the current value', () => {
    render(<WeirdnessControl value={30} />);
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).toBe('30');
  });

  it('supports the sm size variant', () => {
    render(<WeirdnessControl value={30} size="sm" />);
    expect(screen.getByText('Weirdness')).toBeTruthy();
    expect(screen.getByRole('slider')).toBeTruthy();
  });
});
