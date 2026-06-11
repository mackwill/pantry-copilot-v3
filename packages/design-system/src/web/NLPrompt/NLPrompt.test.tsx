import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NLPrompt } from './NLPrompt.js';

const baseProps = {
  value: '',
  onChange: () => undefined,
  placeholder: "Tell me what you're hungry for…",
  eyebrow: 'Ask in your own words',
  submitLabel: 'Cook this',
};

describe('NLPrompt', () => {
  it('renders a textarea with the placeholder and eyebrow', () => {
    render(<NLPrompt {...baseProps} />);
    expect(screen.getByPlaceholderText("Tell me what you're hungry for…")).toBeTruthy();
    expect(screen.getByText('Ask in your own words')).toBeTruthy();
  });

  it('is controlled: shows value and emits onChange', () => {
    const onChange = vi.fn();
    render(<NLPrompt {...baseProps} value="milk and" onChange={onChange} />);
    const box = screen.getByRole('textbox');
    expect((box as HTMLTextAreaElement).value).toBe('milk and');
    fireEvent.change(box, { target: { value: 'milk and scallions' } });
    expect(onChange).toHaveBeenCalledWith('milk and scallions');
  });

  it('fires onSubmit from the submit button', async () => {
    const onSubmit = vi.fn();
    render(<NLPrompt {...baseProps} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Cook this' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('renders the footer slot', () => {
    render(<NLPrompt {...baseProps} footer={<span>weirdness lives here</span>} />);
    expect(screen.getByText('weirdness lives here')).toBeTruthy();
  });

  it('renders a mic button only when mic is provided', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<NLPrompt {...baseProps} />);
    expect(screen.queryByRole('button', { name: 'Voice input' })).toBeNull();
    rerender(<NLPrompt {...baseProps} mic={{ label: 'Voice input', onClick }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Voice input' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
