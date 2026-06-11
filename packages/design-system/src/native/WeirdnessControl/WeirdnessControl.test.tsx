import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeirdnessControl } from './WeirdnessControl.js';

describe('WeirdnessControl (native)', () => {
  it('renders the Weirdness label and the current vocabulary word', () => {
    render(<WeirdnessControl value={70} />);
    expect(screen.getByText('Weirdness')).toBeTruthy();
    expect(screen.getByText('adventurous')).toBeTruthy();
  });

  it('changes the word across breakpoint values', () => {
    const { rerender } = render(<WeirdnessControl value={10} />);
    expect(screen.getByText('normal')).toBeTruthy();
    rerender(<WeirdnessControl value={95} />);
    expect(screen.getByText('chaotic evil')).toBeTruthy();
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
