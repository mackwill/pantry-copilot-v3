import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CategorySheet } from './CategorySheet';

describe('CategorySheet (mobile)', () => {
  it('renders every category label and the selected sub-line', () => {
    render(<CategorySheet open value="dairy" onSelect={vi.fn()} onClose={vi.fn()} />);
    for (const label of ['Produce', 'Dairy', 'Pantry', 'Protein', 'Freezer', 'Drinks', 'Treats']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText('milk · cheese · yogurt · eggs')).toBeTruthy();
  });

  it('marks the current value as the selected radio', () => {
    render(<CategorySheet open value="dairy" onSelect={vi.fn()} onClose={vi.fn()} />);
    const checked = screen
      .getAllByRole('radio')
      .filter((row) => row.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0]?.textContent).toContain('Dairy');
  });

  it('calls onSelect with the pressed category', () => {
    const onSelect = vi.fn();
    render(<CategorySheet open value="dairy" onSelect={onSelect} onClose={vi.fn()} />);
    const produceRow = screen
      .getAllByRole('radio')
      .find((row) => row.textContent.includes('Produce'));
    expect(produceRow).toBeTruthy();
    if (produceRow) fireEvent.click(produceRow);
    expect(onSelect).toHaveBeenCalledWith('produce');
  });

  it('shows the confirm button for the current value', () => {
    render(<CategorySheet open value="dairy" onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Use Dairy')).toBeTruthy();
  });
});
