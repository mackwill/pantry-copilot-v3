import type { CookSession, RecipeStep } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const advanceStep = vi.fn();
vi.mock('../../../lib/api', () => ({
  api: { cook: { advanceStep: { mutate: (input: unknown): Promise<unknown> => advanceStep(input) as Promise<unknown> } } },
}));

import { CookSessionScreen } from './CookSessionScreen';
import { useCookSession } from '../useCookSession';

const steps: RecipeStep[] = [
  { text: 'Melt the butter.', label: 'melt', durationMinutes: 2 },
  { text: 'Add the rice.', label: 'toss' },
];

const session: CookSession = {
  id: 's1',
  recipeId: 'r1',
  status: 'active',
  currentStepIndex: 0,
  totalSteps: 2,
  recipeTitle: 'Charred Scallion Rice',
  startedAt: '2026-06-16T18:48:00.000Z',
};

function Harness({ onFinish }: { onFinish: () => void }) {
  const cook = useCookSession(session, steps);
  return (
    <CookSessionScreen
      recipeTitle="Charred Scallion Rice"
      summary="Fast skillet rice."
      caveat="Don't let it stick."
      cook={cook}
      onExit={vi.fn()}
      onFinish={onFinish}
    />
  );
}

describe('CookSessionScreen', () => {
  it('renders the dark stove step, seeded timer and the caveat chip', () => {
    advanceStep.mockResolvedValue(undefined);
    render(<Harness onFinish={vi.fn()} />);
    expect(screen.getByText('Melt the butter.')).toBeTruthy();
    // "2:00" shows both inside the ring and as the duration meta.
    expect(screen.getAllByText('2:00').length).toBeGreaterThan(0);
    expect(screen.getByText("Don't let it stick.")).toBeTruthy();
  });

  it('reaches the last step and surfaces Finish', () => {
    advanceStep.mockResolvedValue(undefined);
    const onFinish = vi.fn();
    render(<Harness onFinish={onFinish} />);
    fireEvent.click(screen.getByTestId('cook-next'));
    fireEvent.click(screen.getByTestId('cook-finish'));
    expect(onFinish).toHaveBeenCalledOnce();
  });
});
