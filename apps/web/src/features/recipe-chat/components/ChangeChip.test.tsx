import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangeChip } from './ChangeChip';
import { ChatBubbleAI } from './ChatBubbleAI';

describe('ChangeChip', () => {
  it('renders the change text', () => {
    render(<ChangeChip tag="change" text="Oil: ¼ cup → 2 tbsp" />);
    expect(screen.getByText('Oil: ¼ cup → 2 tbsp')).toBeTruthy();
  });
});

describe('ChatBubbleAI', () => {
  it('renders the summary and one chip per change', () => {
    render(
      <ChatBubbleAI
        summary="Cut the oil and added greens."
        changes={[
          { tag: 'change', text: 'Oil halved' },
          { tag: 'add', text: 'Add spinach' },
        ]}
      />,
    );
    expect(screen.getByText('Cut the oil and added greens.')).toBeTruthy();
    expect(screen.getByText('Oil halved')).toBeTruthy();
    expect(screen.getByText('Add spinach')).toBeTruthy();
  });

  it('renders only the summary when there are no changes', () => {
    render(<ChatBubbleAI summary="Thinking…" />);
    expect(screen.getByText('Thinking…')).toBeTruthy();
  });
});
