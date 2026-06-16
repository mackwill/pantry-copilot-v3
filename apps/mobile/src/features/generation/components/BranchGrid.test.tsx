import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BranchGrid } from './BranchGrid';

describe('BranchGrid (mobile)', () => {
  it('renders the four branch tiles', () => {
    render(<BranchGrid onBranch={vi.fn()} />);
    expect(screen.getByText('Weirder')).toBeTruthy();
    expect(screen.getByText('Faster (< 15)')).toBeTruthy();
    expect(screen.getByText('Vegetarian')).toBeTruthy();
    expect(screen.getByText('New angle')).toBeTruthy();
  });

  it('fires the matching branch action on tap', () => {
    const onBranch = vi.fn();
    render(<BranchGrid onBranch={onBranch} />);
    fireEvent.click(screen.getByTestId('branch-weirder'));
    expect(onBranch).toHaveBeenCalledWith('weirder');
    fireEvent.click(screen.getByTestId('branch-new-angle'));
    expect(onBranch).toHaveBeenCalledWith('new-angle');
  });
});
