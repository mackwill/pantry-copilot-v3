import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eyebrow } from './Eyebrow.js';

describe('Eyebrow', () => {
  it('renders uppercase label text', () => {
    render(<Eyebrow>Weirdness</Eyebrow>);
    const el = screen.getByText('Weirdness');
    expect(el.className).toContain('eyebrow');
  });
});
