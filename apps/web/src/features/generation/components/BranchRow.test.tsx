import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BranchRow } from './BranchRow';

describe('BranchRow', () => {
  it('renders the four branch tiles', () => {
    render(<BranchRow onBranch={vi.fn()} />);
    for (const label of ['Weirder', 'Faster', 'Vegetarian only', 'Different angle']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('fires the matching branch action on tap', async () => {
    const onBranch = vi.fn();
    render(<BranchRow onBranch={onBranch} />);
    await userEvent.click(screen.getByText('Weirder'));
    expect(onBranch).toHaveBeenCalledWith('weirder');
    await userEvent.click(screen.getByText('Different angle'));
    expect(onBranch).toHaveBeenCalledWith('new-angle');
  });
});
