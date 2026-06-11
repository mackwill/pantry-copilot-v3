import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon.js';

describe('Icon (native)', () => {
  it('renders an svg for the named lucide icon', () => {
    render(<Icon name="Refrigerator" testID="icon" />);
    const el = screen.getByTestId('icon');
    expect(el.tagName.toLowerCase()).toBe('svg');
  });

  it('defaults to size 18 with design stroke width 1.6', () => {
    render(<Icon name="Check" testID="icon" />);
    const el = screen.getByTestId('icon');
    expect(el.getAttribute('width')).toBe('18');
    expect(el.getAttribute('height')).toBe('18');
    expect(el.getAttribute('stroke-width')).toBe('1.6');
  });

  it('accepts size and color overrides', () => {
    render(<Icon name="Sparkles" size={20} color="#4F6B2E" testID="icon" />);
    const el = screen.getByTestId('icon');
    expect(el.getAttribute('width')).toBe('20');
    expect(el.getAttribute('stroke')).toBe('#4F6B2E');
  });

  it('exposes the mobile-board icons (tab bar, sheets, prompt)', () => {
    for (const name of ['House', 'ChefHat', 'ScanLine', 'ArrowRight', 'X'] as const) {
      const { unmount } = render(<Icon name={name} testID={`icon-${name}`} />);
      expect(screen.getByTestId(`icon-${name}`)).toBeTruthy();
      unmount();
    }
  });
});
