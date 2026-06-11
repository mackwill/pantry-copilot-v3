import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input.js';

describe('Input', () => {
  it('is a real controlled input (not the mockup span)', async () => {
    const onChange = vi.fn();
    render(<Input value="" onChange={onChange} placeholder="Search pantry" />);
    const input = screen.getByPlaceholderText('Search pantry');
    await userEvent.type(input, 'milk');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders current value', () => {
    render(<Input value="2% milk" onChange={() => undefined} />);
    expect(screen.getByDisplayValue('2% milk')).toBeDefined();
  });
});
