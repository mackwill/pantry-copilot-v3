import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Wordmark } from './Wordmark.js';

describe('Wordmark (native)', () => {
  it('renders the brand in the display family at the default 26px', () => {
    render(<Wordmark testID="wordmark" />);
    const mark = screen.getByTestId('wordmark');
    expect(mark.textContent).toBe('PantryCoPilot');
    const style = getComputedStyle(mark);
    expect(style.fontFamily).toContain('Newsreader');
    expect(style.fontSize).toBe('26px');
  });

  it('sets the Co segment italic in the accent color', () => {
    render(<Wordmark />);
    const co = screen.getByText('Co');
    const style = getComputedStyle(co);
    expect(style.fontStyle).toBe('italic');
    expect(style.color).toBe('rgb(79, 107, 46)');
  });

  it('scales with the size prop', () => {
    render(<Wordmark size={40} testID="wordmark" />);
    expect(getComputedStyle(screen.getByTestId('wordmark')).fontSize).toBe('40px');
  });
});
