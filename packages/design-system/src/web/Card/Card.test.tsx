import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card.js';

describe('Card', () => {
  it('renders children on a raised surface', () => {
    render(<Card>contents</Card>);
    const el = screen.getByText('contents');
    expect(el.className).toContain('card');
  });

  it('accepts custom padding', () => {
    render(<Card padding={12}>tight</Card>);
    expect(screen.getByText('tight').style.padding).toBe('12px');
  });
});
