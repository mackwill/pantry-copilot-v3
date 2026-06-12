import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon.js';

describe('Icon', () => {
  it('renders the named lucide icon as an svg at the given size', () => {
    const { container } = render(<Icon name="SlidersHorizontal" size={24} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('defaults to size 18 and stroke width 1.6 (design spec)', () => {
    const { container } = render(<Icon name="Camera" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('18');
    expect(svg?.getAttribute('stroke-width')).toBe('1.6');
  });

  it('exposes the §00 auth icons (inputs + oauth buttons)', () => {
    for (const name of ['AtSign', 'Lock', 'Apple', 'Chrome'] as const) {
      const { container, unmount } = render(<Icon name={name} size={16} />);
      expect(container.querySelector('svg'), name).not.toBeNull();
      unmount();
    }
  });
});
