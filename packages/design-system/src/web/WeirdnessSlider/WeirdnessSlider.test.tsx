import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeirdnessSlider } from './WeirdnessSlider.js';

describe('WeirdnessSlider', () => {
  it.each([
    [10, 'normal'],
    [40, 'curious'],
    [70, 'adventurous'],
    [95, 'chaotic evil'],
  ])('labels value %i as %s', (value, label) => {
    render(<WeirdnessSlider value={value} compact />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('crosses label breakpoints at 25/55/85', () => {
    const { rerender } = render(<WeirdnessSlider value={24} compact />);
    expect(screen.getByText('normal')).toBeTruthy();
    rerender(<WeirdnessSlider value={25} compact />);
    expect(screen.getByText('curious')).toBeTruthy();
    rerender(<WeirdnessSlider value={55} compact />);
    expect(screen.getByText('adventurous')).toBeTruthy();
    rerender(<WeirdnessSlider value={85} compact />);
    expect(screen.getByText('chaotic evil')).toBeTruthy();
  });

  it('shows the full vocabulary row only when not compact', () => {
    render(<WeirdnessSlider value={10} />);
    expect(screen.getByText('curious')).toBeTruthy();
    expect(screen.getByText('adventurous')).toBeTruthy();
    expect(screen.getByText('chaotic evil')).toBeTruthy();
    // current label + vocab row both say "normal" at value 10
    expect(screen.getAllByText('normal')).toHaveLength(2);
  });

  it('emits numeric onChange from the underlying range input', () => {
    const onChange = vi.fn();
    render(<WeirdnessSlider value={30} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith(60);
  });
});
