import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet.js';

function renderSheet(overrides: { open?: boolean; onClose?: () => void } = {}) {
  const onClose = overrides.onClose ?? vi.fn();
  const view = render(
    <BottomSheet
      open={overrides.open ?? true}
      onClose={onClose}
      eyebrow="Category"
      title="What kind of thing is this?"
      footer={
        <>
          <button type="button">Cancel</button>
          <button type="button">Use Dairy</button>
        </>
      }
    >
      <p>Sheet body</p>
    </BottomSheet>,
  );
  return { onClose, ...view };
}

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    renderSheet({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders an aria-modal dialog with title, eyebrow, body, and footer', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('What kind of thing is this?')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Sheet body')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Use Dairy' })).toBeTruthy();
  });

  it('moves focus inside the sheet on open', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('closes on Escape', async () => {
    const { onClose } = renderSheet();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on scrim click', () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByTestId('bottom-sheet-scrim'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes from the header close button', async () => {
    const { onClose } = renderSheet();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('traps Tab focus within the sheet', async () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    // More tabs than focusables — focus must stay inside the dialog.
    for (let i = 0; i < 6; i += 1) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});
