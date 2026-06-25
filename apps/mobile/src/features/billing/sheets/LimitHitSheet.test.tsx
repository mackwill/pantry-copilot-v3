import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { billingStrings } from '../strings';
import { LimitHitSheet } from './LimitHitSheet';

describe('LimitHitSheet', () => {
  it('renders the limit copy and CTAs when open', () => {
    render(<LimitHitSheet open onClose={vi.fn()} onUpgrade={vi.fn()} />);
    expect(screen.getByText(billingStrings.limitHit.eyebrow)).toBeTruthy();
    expect(screen.getByText(billingStrings.limitHit.quota)).toBeTruthy();
    expect(screen.getByText(billingStrings.limitHit.startTrial)).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    render(<LimitHitSheet open={false} onClose={vi.fn()} onUpgrade={vi.fn()} />);
    expect(screen.queryByText(billingStrings.limitHit.eyebrow)).toBeNull();
  });

  it('fires onUpgrade when the primary CTA is pressed', () => {
    const onUpgrade = vi.fn();
    render(<LimitHitSheet open onClose={vi.fn()} onUpgrade={onUpgrade} />);
    fireEvent.click(screen.getByTestId('limit-hit-upgrade'));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('fires onClose from the sheet close control', () => {
    const onClose = vi.fn();
    render(<LimitHitSheet open onClose={onClose} onUpgrade={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
