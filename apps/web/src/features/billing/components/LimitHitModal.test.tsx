import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { billingStrings as s } from '../strings';
import { LimitHitModal } from './LimitHitModal';

afterEach(() => {
  vi.clearAllMocks();
});

describe('LimitHitModal', () => {
  it('renders the limit-hit copy when open', () => {
    render(<LimitHitModal open onClose={vi.fn()} onUpgrade={vi.fn()} />);
    expect(screen.getByText(s.limitHit.eyebrow)).toBeTruthy();
    expect(screen.getByText(s.limitHit.quota)).toBeTruthy();
    expect(screen.getByText(s.limitHit.headlineEmphasis)).toBeTruthy();
    expect(screen.getByRole('dialog', { name: s.limitHit.ariaLabel })).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    render(<LimitHitModal open={false} onClose={vi.fn()} onUpgrade={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByText(s.limitHit.eyebrow)).toBeNull();
  });

  it('fires onUpgrade from the primary CTA', async () => {
    const onUpgrade = vi.fn();
    render(<LimitHitModal open onClose={vi.fn()} onUpgrade={onUpgrade} />);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(s.limitHit.startTrial) }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('fires onClose from the close button', async () => {
    const onClose = vi.fn();
    render(<LimitHitModal open onClose={onClose} onUpgrade={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: s.limitHit.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fires onClose from "Wait til Sunday"', async () => {
    const onClose = vi.fn();
    render(<LimitHitModal open onClose={onClose} onUpgrade={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: s.limitHit.waitTilSunday }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
