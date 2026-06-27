import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuickActions } from './QuickActions';

describe('QuickActions', () => {
  it('calls onScan when the Scan card is pressed', () => {
    const onScan = vi.fn();
    render(<QuickActions onScan={onScan} />);
    fireEvent.click(screen.getByTestId('quick-action-scan'));
    expect(onScan).toHaveBeenCalledTimes(1);
  });

  it('does not render Receipt or Speak shortcut cards', () => {
    render(<QuickActions onScan={vi.fn()} />);
    expect(screen.queryByText('Receipt')).toBeNull();
    expect(screen.queryByText('Speak')).toBeNull();
  });
});
