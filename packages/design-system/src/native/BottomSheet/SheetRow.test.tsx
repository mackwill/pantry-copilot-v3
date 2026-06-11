import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SheetRow } from './SheetRow.js';

describe('SheetRow (native)', () => {
  it('renders label and sub line', () => {
    render(<SheetRow icon="Refrigerator" label="Fridge — top shelf" sub="most things go here" />);
    expect(screen.getByText('Fridge — top shelf')).toBeTruthy();
    expect(screen.getByText('most things go here')).toBeTruthy();
  });

  it('exposes selection state as a radio', () => {
    render(<SheetRow label="Dairy" selected />);
    expect(screen.getByRole('radio').getAttribute('aria-checked')).toBe('true');
  });

  it('is unchecked when not selected', () => {
    render(<SheetRow label="Produce" />);
    expect(screen.getByRole('radio').getAttribute('aria-checked')).toBe('false');
  });

  it('fires onPress', () => {
    const onPress = vi.fn();
    render(<SheetRow label="Freezer" onPress={onPress} />);
    fireEvent.click(screen.getByRole('radio'));
    expect(onPress).toHaveBeenCalledOnce();
  });
});
