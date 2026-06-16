import type { CookSession, RecipeStep } from '@pantry/contracts';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';

function timerFor(step: RecipeStep | undefined): number | null {
  return step?.durationMinutes !== undefined ? step.durationMinutes * 60 : null;
}

export interface UseCookSession {
  stepIndex: number;
  step: RecipeStep | undefined;
  nextStep: RecipeStep | undefined;
  totalSteps: number;
  secondsRemaining: number | null;
  durationSeconds: number | null;
  isFirst: boolean;
  isLast: boolean;
  goPrev: () => void;
  goNext: () => void;
}

/**
 * In-session state for the dark stove screen: current step + the client-side
 * countdown seeded from `durationMinutes` (never persisted — decision C). Step
 * moves persist via `cook.advanceStep` so a killed app resumes to the right step.
 */
export function useCookSession(session: CookSession, steps: readonly RecipeStep[]): UseCookSession {
  const [stepIndex, setStepIndex] = useState(session.currentStepIndex);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => timerFor(steps[session.currentStepIndex]));

  const hasTimer = secondsRemaining !== null;
  useEffect(() => {
    if (!hasTimer) return undefined;
    const id = setInterval(() => {
      setSecondsRemaining((s) => (s === null || s <= 0 ? s : s - 1));
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [hasTimer]);

  const moveTo = useCallback(
    (index: number) => {
      setStepIndex(index);
      setSecondsRemaining(timerFor(steps[index]));
      void api.cook.advanceStep.mutate({ sessionId: session.id, stepIndex: index }).catch(() => undefined);
    },
    [session.id, steps],
  );

  const goPrev = useCallback(() => {
    if (stepIndex > 0) moveTo(stepIndex - 1);
  }, [stepIndex, moveTo]);

  const goNext = useCallback(() => {
    if (stepIndex < steps.length - 1) moveTo(stepIndex + 1);
  }, [stepIndex, steps.length, moveTo]);

  return {
    stepIndex,
    step: steps[stepIndex],
    nextStep: steps[stepIndex + 1],
    totalSteps: steps.length,
    secondsRemaining,
    durationSeconds: timerFor(steps[stepIndex]),
    isFirst: stepIndex === 0,
    isLast: stepIndex === steps.length - 1,
    goPrev,
    goNext,
  };
}
