import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eyebrow } from './Eyebrow.js';

describe('Eyebrow (native)', () => {
  it('renders its children', () => {
    render(<Eyebrow>Welcome back</Eyebrow>);
    expect(screen.getByText('Welcome back')).toBeTruthy();
  });

  it('uppercases at 11px in the sans family (board spec)', () => {
    render(<Eyebrow>Welcome back</Eyebrow>);
    const style = getComputedStyle(screen.getByText('Welcome back'));
    expect(style.textTransform).toBe('uppercase');
    expect(style.fontSize).toBe('11px');
    expect(style.fontFamily).toContain('Inter');
  });

  it('accepts a color override', () => {
    render(<Eyebrow color="#4F6B2E">Greens</Eyebrow>);
    const style = getComputedStyle(screen.getByText('Greens'));
    expect(style.color).toBe('rgb(79, 107, 46)');
  });
});
