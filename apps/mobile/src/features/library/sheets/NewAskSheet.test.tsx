import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { libraryStrings } from '../strings';
import { NewAskSheet } from './NewAskSheet';

describe('NewAskSheet (mobile)', () => {
  it('renders the prompt input, weirdness control and suggestion chips', () => {
    render(<NewAskSheet open onClose={vi.fn()} onCook={vi.fn()} />);
    expect(screen.getByTestId('new-ask-input')).toBeTruthy();
    expect(screen.getByText(libraryStrings.newAsk.tryEyebrow)).toBeTruthy();
    expect(screen.getByText(libraryStrings.newAsk.suggestions[0] as string)).toBeTruthy();
  });

  it('calls onCook with the typed prompt and weirdness', () => {
    const onCook = vi.fn();
    render(<NewAskSheet open onClose={vi.fn()} onCook={onCook} />);
    fireEvent.change(screen.getByTestId('new-ask-input'), { target: { value: 'cozy carrots' } });
    fireEvent.click(screen.getByText(libraryStrings.newAsk.cookThis));
    expect(onCook).toHaveBeenCalledTimes(1);
    expect(onCook.mock.calls[0]?.[0]).toBe('cozy carrots');
    expect(typeof onCook.mock.calls[0]?.[1]).toBe('number');
  });

  it('does not call onCook when the prompt is empty', () => {
    const onCook = vi.fn();
    render(<NewAskSheet open onClose={vi.fn()} onCook={onCook} />);
    fireEvent.click(screen.getByText(libraryStrings.newAsk.cookThis));
    expect(onCook).not.toHaveBeenCalled();
  });
});
