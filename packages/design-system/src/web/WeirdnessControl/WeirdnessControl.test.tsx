import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeirdnessControl } from './WeirdnessControl.js';

describe('WeirdnessControl', () => {
  it.each([
    [10, 'normal'],
    [40, 'curious'],
    [70, 'adventurous'],
    [95, 'chaotic evil'],
  ])('shows the current vocabulary word for value %i', (value, label) => {
    render(<WeirdnessControl value={value} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('emits numeric onChange from the underlying range input', () => {
    const onChange = vi.fn();
    render(<WeirdnessControl value={30} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '80' } });
    expect(onChange).toHaveBeenCalledWith(80);
  });

  it('applies the sm size variant', () => {
    const { container } = render(<WeirdnessControl value={30} size="sm" />);
    expect(container.firstElementChild?.className).toContain('sm');
  });
});
