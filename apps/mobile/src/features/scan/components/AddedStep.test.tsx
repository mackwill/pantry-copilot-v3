import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ScanSummary } from '../useScanFlow';
import { AddedStep } from './AddedStep';

const summary: ScanSummary = { added: 2, pantryTotal: 14, attention: 1 };

describe('AddedStep ideas card', () => {
  it('navigates to ideas when the "Ideas ready" card is pressed', () => {
    const onSeeIdeas = vi.fn();
    render(
      <AddedStep summary={summary} onSeeIdeas={onSeeIdeas} onViewPantry={vi.fn()} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByTestId('scan-ideas-card'));
    expect(onSeeIdeas).toHaveBeenCalledTimes(1);
  });
});
