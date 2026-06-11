import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeirdnessSlider } from './WeirdnessSlider.js';

describe('WeirdnessSlider (native)', () => {
  it('shows the vocabulary word for the current value', () => {
    render(<WeirdnessSlider value={70} />);
    expect(screen.getAllByText('adventurous').length).toBeGreaterThan(0);
  });

  it('changes the word across the 25/55/85 breakpoints', () => {
    const { rerender } = render(<WeirdnessSlider value={10} compact />);
    expect(screen.getByText('normal')).toBeTruthy();
    rerender(<WeirdnessSlider value={40} compact />);
    expect(screen.getByText('curious')).toBeTruthy();
    rerender(<WeirdnessSlider value={95} compact />);
    expect(screen.getByText('chaotic evil')).toBeTruthy();
  });

  it('renders the full vocabulary row unless compact', () => {
    render(<WeirdnessSlider value={40} />);
    for (const word of ['normal', 'curious', 'adventurous', 'chaotic evil']) {
      expect(screen.getAllByText(word).length).toBeGreaterThan(0);
    }
  });

  it('hides the vocabulary row when compact', () => {
    render(<WeirdnessSlider value={40} compact />);
    expect(screen.queryByText('normal')).toBeNull();
    expect(screen.queryByText('chaotic evil')).toBeNull();
  });

  it('exposes a slider role with the current value', () => {
    render(<WeirdnessSlider value={40} />);
    const slider = screen.getByRole('slider');
    expect(slider.getAttribute('aria-valuenow')).toBe('40');
    expect(slider.getAttribute('aria-valuemin')).toBe('0');
    expect(slider.getAttribute('aria-valuemax')).toBe('100');
  });
});
