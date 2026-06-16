import { act, fireEvent, render, screen } from '@testing-library/react';
import { Animated, Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet.js';

describe('BottomSheet (native)', () => {
  it('renders nothing while closed', () => {
    render(
      <BottomSheet open={false} onClose={vi.fn()} title="Pick a spot">
        <Text>Fridge</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Pick a spot')).toBeNull();
    expect(screen.queryByText('Fridge')).toBeNull();
  });

  it('renders eyebrow, title and children when open', () => {
    render(
      <BottomSheet open onClose={vi.fn()} eyebrow="Category" title="What kind of thing is this?">
        <Text>Dairy</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('What kind of thing is this?')).toBeTruthy();
    expect(screen.getByText('Dairy')).toBeTruthy();
  });

  it('is exposed as a modal dialog', () => {
    render(
      <BottomSheet open onClose={vi.fn()} title="Pick a spot">
        <Text>Fridge</Text>
      </BottomSheet>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('calls onClose from the header close button', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} title="Pick a spot">
        <Text>Fridge</Text>
      </BottomSheet>,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the scrim is pressed', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose} title="Pick a spot">
        <Text>Fridge</Text>
      </BottomSheet>,
    );
    fireEvent.click(screen.getByTestId('bottom-sheet-scrim'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders the footer slot', () => {
    render(
      <BottomSheet open onClose={vi.fn()} title="Best by" footer={<Text>Save · May 10</Text>}>
        <Text>Quick pick</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Save · May 10')).toBeTruthy();
  });

  it('applies an animated translateY transform to the sheet panel', () => {
    render(
      <BottomSheet open onClose={vi.fn()} title="Pick a spot">
        <Text>Fridge</Text>
      </BottomSheet>,
    );
    // The sheet slides in via an Animated transform rather than popping in.
    expect(screen.getByTestId('bottom-sheet-panel').style.transform).toContain('translateY');
  });

  it('unmounts only once the slide-out animation completes, not on the open flip', () => {
    // jsdom resolves Animated synchronously, so intercept the parallel
    // animation's completion callback to prove the contract: the sheet stays
    // mounted after `open` flips false and unmounts only when the slide-out
    // reports finished.
    let endCallback: ((result: { finished: boolean }) => void) | undefined;
    const parallelSpy = vi.spyOn(Animated, 'parallel').mockReturnValue({
      start: (cb?: (result: { finished: boolean }) => void) => {
        endCallback = cb;
      },
      stop: () => {},
      reset: () => {},
    });

    const { rerender } = render(
      <BottomSheet open onClose={vi.fn()} title="Pick a spot">
        <Text>Fridge</Text>
      </BottomSheet>,
    );
    rerender(
      <BottomSheet open={false} onClose={vi.fn()} title="Pick a spot">
        <Text>Fridge</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Fridge')).not.toBeNull();

    act(() => endCallback?.({ finished: true }));
    expect(screen.queryByText('Fridge')).toBeNull();

    parallelSpy.mockRestore();
  });
});
