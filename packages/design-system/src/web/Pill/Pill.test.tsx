import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pill } from './Pill.js';

describe('Pill', () => {
  it('renders neutral tone by default', () => {
    render(<Pill>3 items</Pill>);
    expect(screen.getByText('3 items').className).toContain('neutral');
  });

  it('supports all design tones', () => {
    for (const tone of [
      'neutral',
      'success',
      'warning',
      'danger',
      'accent',
      'inverse',
      'outline',
    ] as const) {
      const { unmount } = render(<Pill tone={tone}>t</Pill>);
      expect(screen.getByText('t').className).toContain(tone);
      unmount();
    }
  });
});
