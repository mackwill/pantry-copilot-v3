import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ConsumeRowModel } from '../consumeRows';
import { cookStrings } from '../strings';
import { ConsumeRow } from './ConsumeRow';

function row(overrides: Partial<ConsumeRowModel> = {}): ConsumeRowModel {
  return { pantryItemId: 'p1', name: 'Rice', unit: 'cup', have: 3, quantityUsed: 2, finished: false, ...overrides };
}

describe('ConsumeRow', () => {
  it('steps the used quantity up by a whole unit for count items', () => {
    const onChange = vi.fn();
    render(<ConsumeRow row={row({ unit: 'ea' })} baseline={2} onChange={onChange} />);
    fireEvent.click(screen.getByTestId('consume-inc-p1'));
    // 2 → 3 of 3 in stock → finished.
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ quantityUsed: 3, finished: true }));
  });

  it('marks the item finished when "Used it all" is tapped', () => {
    const onChange = vi.fn();
    render(<ConsumeRow row={row()} baseline={2} onChange={onChange} />);
    fireEvent.click(screen.getByText(cookStrings.usedItAll));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ quantityUsed: 3, finished: true }));
  });

  it('hides the relative pills once the item is finished', () => {
    render(<ConsumeRow row={row({ finished: true, quantityUsed: 3 })} baseline={2} onChange={vi.fn()} />);
    expect(screen.queryByText(cookStrings.usedMore)).toBeNull();
    expect(screen.getByText(cookStrings.usedItAll)).toBeTruthy();
  });
});
