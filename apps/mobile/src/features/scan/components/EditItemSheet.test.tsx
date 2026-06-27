import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReviewRow } from '../useScanFlow';
import { EditItemSheet } from './EditItemSheet';

const row: ReviewRow = {
  id: 'r1',
  name: 'Mlik',
  quantity: 2,
  unit: 'ea',
  category: 'dairy',
  location: 'fridge_top',
  confidence: 0.9,
  notes: null,
  selected: true,
};

describe('EditItemSheet', () => {
  it('saves the corrected name + quantity and closes', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EditItemSheet open row={row} onSave={onSave} onClose={onClose} />);

    fireEvent.change(screen.getByTestId('edit-item-name'), { target: { value: 'Milk' } });
    fireEvent.change(screen.getByTestId('edit-item-quantity'), { target: { value: '3' } });
    fireEvent.click(screen.getByTestId('edit-item-save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Milk', quantity: 3, category: 'dairy' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('treats a cleared quantity as null', () => {
    const onSave = vi.fn();
    render(<EditItemSheet open row={row} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('edit-item-quantity'), { target: { value: '' } });
    fireEvent.click(screen.getByTestId('edit-item-save'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ quantity: null }));
  });
});
