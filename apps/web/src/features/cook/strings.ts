/** Cook in-session + resume strings (board §03.5 / §03). */
export const cookStrings = {
  cookingNow: 'Cooking now',
  exit: 'Exit',
  resume: 'Resume',
  startedAt: (time: string): string => `started ${time}`,
  stepProgress: (step: number, total: number, label?: string): string =>
    label === undefined ? `step ${step.toString()} of ${total.toString()}` : `step ${step.toString()} of ${total.toString()} · ${label}`,
  usingInStep: 'Using in this step',
  ingredientCount: (n: number): string => `${n.toString()} ${n === 1 ? 'ingredient' : 'ingredients'}`,
  upNext: 'Up next',
  previous: 'Previous',
  next: 'Next',
  finish: 'Finish cooking',
  timerOf: (total: string): string => `of ${total}`,
  untimed: 'No timer — go by feel',
} as const;

/** Format an ISO timestamp as a short local clock time, e.g. "6:48 pm". */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
}

/** Format a whole number of seconds as `m:ss`. */
export function formatTimer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
}
