import type { CookSession, RecipeStep } from '@pantry/contracts';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const advanceStep = vi.fn();
vi.mock('../../lib/api', () => ({
  api: { cook: { advanceStep: { mutate: (input: unknown): Promise<unknown> => advanceStep(input) as Promise<unknown> } } },
}));

import { useCookSession } from './useCookSession';

const steps: RecipeStep[] = [
  { text: 'Melt the butter.', label: 'melt', durationMinutes: 2 },
  { text: 'Add the rice.', label: 'toss' },
  { text: 'Finish with soy.', label: 'finish' },
];

function session(currentStepIndex = 0): CookSession {
  return {
    id: 's1',
    recipeId: 'r1',
    status: 'active',
    currentStepIndex,
    totalSteps: 3,
    recipeTitle: 'Rice',
    startedAt: '2026-06-16T18:48:00.000Z',
  };
}

describe('useCookSession', () => {
  it('seeds the step and the timer from the session + step duration', () => {
    advanceStep.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCookSession(session(0), steps));
    expect(result.current.step?.text).toBe('Melt the butter.');
    expect(result.current.secondsRemaining).toBe(120);
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
  });

  it('advances to the next step, persists it, and clears the timer for an untimed step', () => {
    advanceStep.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCookSession(session(0), steps));
    act(() => {
      result.current.goNext();
    });
    expect(result.current.stepIndex).toBe(1);
    expect(result.current.secondsRemaining).toBeNull();
    expect(advanceStep).toHaveBeenCalledWith({ sessionId: 's1', stepIndex: 1 });
  });

  it('reports the last step', () => {
    advanceStep.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCookSession(session(2), steps));
    expect(result.current.isLast).toBe(true);
    expect(result.current.nextStep).toBeUndefined();
  });
});
