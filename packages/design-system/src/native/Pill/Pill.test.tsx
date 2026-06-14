import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Pill } from './Pill.js';

describe('Pill (native)', () => {
  it('renders its children', () => {
    render(<Pill tone="warning">2d</Pill>);
    expect(screen.getByText('2d')).toBeTruthy();
  });

  it('defaults to the neutral tone', () => {
    render(<Pill>fresh</Pill>);
    expect(screen.getByText('fresh')).toBeTruthy();
  });

  it('renders each tone', () => {
    render(
      <>
        <Pill tone="success">ok</Pill>
        <Pill tone="danger">past</Pill>
        <Pill tone="inverse">inv</Pill>
        <Pill tone="outline">out</Pill>
      </>,
    );
    expect(screen.getByText('ok')).toBeTruthy();
    expect(screen.getByText('past')).toBeTruthy();
    expect(screen.getByText('inv')).toBeTruthy();
    expect(screen.getByText('out')).toBeTruthy();
  });
});
