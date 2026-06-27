import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UseScanFlow } from '../useScanFlow';
import { ReviewStep } from './ReviewStep';

function makeFlow(): UseScanFlow {
  return {
    rows: [],
    selectedCount: 0,
    toggle: vi.fn(),
    addMissing: vi.fn(),
    confirm: vi.fn(),
  } as unknown as UseScanFlow;
}

describe('ReviewStep header controls', () => {
  it('calls onBack when the back chevron is pressed', () => {
    const onBack = vi.fn();
    render(<ReviewStep flow={makeFlow()} onBack={onBack} onRescan={vi.fn()} />);
    fireEvent.click(screen.getByTestId('review-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('calls onRescan when the re-scan icon is pressed', () => {
    const onRescan = vi.fn();
    render(<ReviewStep flow={makeFlow()} onBack={vi.fn()} onRescan={onRescan} />);
    fireEvent.click(screen.getByTestId('review-rescan'));
    expect(onRescan).toHaveBeenCalledTimes(1);
  });
});
