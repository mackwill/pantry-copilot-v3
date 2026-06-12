import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Text } from 'react-native';
import { Input } from './Input.js';

describe('Input (native)', () => {
  it('is controlled: shows value and reports edits through onChangeText', async () => {
    const onChangeText = vi.fn();
    render(<Input value="mara" onChangeText={onChangeText} testID="email" />);
    const input = screen.getByTestId<HTMLInputElement>('email');
    expect(input.value).toBe('mara');
    await userEvent.type(input, '!');
    expect(onChangeText).toHaveBeenCalledWith('mara!');
  });

  it('renders the leftIcon slot', () => {
    render(
      <Input
        value=""
        onChangeText={() => undefined}
        leftIcon={<Text testID="left-icon">@</Text>}
      />,
    );
    expect(screen.getByTestId('left-icon')).toBeTruthy();
  });

  it('passes secureTextEntry through as a password input', () => {
    render(<Input value="" onChangeText={() => undefined} secureTextEntry testID="pw" />);
    expect(screen.getByTestId<HTMLInputElement>('pw').type).toBe('password');
  });

  it('shows the placeholder', () => {
    render(<Input value="" onChangeText={() => undefined} placeholder="you@kitchen.com" />);
    expect(screen.getByPlaceholderText('you@kitchen.com')).toBeTruthy();
  });
});
