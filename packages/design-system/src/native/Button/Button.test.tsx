import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Text } from 'react-native';
import { Button } from './Button.js';

describe('Button (native)', () => {
  it('fires onPress', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('does not fire onPress when disabled', () => {
    const onPress = vi.fn();
    render(
      <Button onPress={onPress} disabled>
        Nope
      </Button>,
    );
    // rn-web sets pointer-events: none on disabled Pressables, which userEvent
    // refuses to click; dispatch directly to prove the handler still won't run.
    fireEvent.click(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders primary on the accent with accent foreground text', () => {
    render(<Button>Go</Button>);
    const btn = screen.getByRole('button');
    expect(getComputedStyle(btn).backgroundColor).toBe('rgb(79, 107, 46)');
    expect(getComputedStyle(screen.getByText('Go')).color).toBe('rgb(255, 255, 255)');
  });

  it('renders secondary transparent with the strong line border', () => {
    render(<Button kind="secondary">Go</Button>);
    const style = getComputedStyle(screen.getByRole('button'));
    expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopColor).toBe('rgb(201, 201, 192)');
  });

  it('stretches with full', () => {
    render(<Button full>Wide</Button>);
    expect(getComputedStyle(screen.getByRole('button')).alignSelf).toBe('stretch');
  });

  it('renders the leftIcon slot', () => {
    render(<Button leftIcon={<Text testID="left-icon">@</Text>}>With icon</Button>);
    expect(screen.getByTestId('left-icon')).toBeTruthy();
  });

  it('sizes md at 38 high with 14px label', () => {
    render(<Button>Go</Button>);
    expect(getComputedStyle(screen.getByRole('button')).height).toBe('38px');
    expect(getComputedStyle(screen.getByText('Go')).fontSize).toBe('14px');
  });
});
