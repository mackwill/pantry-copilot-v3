import type { FreshnessTone } from '@pantry/contracts';

const DAY_MS = 86_400_000;
const WARNING_DAYS = 3;

export interface Freshness {
  tone: FreshnessTone;
  daysLeft: number | null; // null when untracked
}

export function freshnessFor(bestBy: string | null, now: Date = new Date()): Freshness {
  if (bestBy === null) return { tone: 'success', daysLeft: null };
  const due = new Date(`${bestBy}T00:00:00Z`).getTime();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
  const daysLeft = Math.round((due - start) / DAY_MS);
  if (daysLeft < 0) return { tone: 'danger', daysLeft };
  if (daysLeft <= WARNING_DAYS) return { tone: 'warning', daysLeft };
  return { tone: 'success', daysLeft };
}

const TONE_RANK: Record<FreshnessTone, number> = { danger: 0, warning: 1, success: 2 };

export function rankByExpiration<T extends { bestBy: string | null }>(items: readonly T[], now: Date = new Date()): T[] {
  return [...items].sort((a, b) => {
    const fa = freshnessFor(a.bestBy, now);
    const fb = freshnessFor(b.bestBy, now);
    if (TONE_RANK[fa.tone] !== TONE_RANK[fb.tone]) return TONE_RANK[fa.tone] - TONE_RANK[fb.tone];
    if (fa.daysLeft === null) return 1;
    if (fb.daysLeft === null) return -1;
    return fa.daysLeft - fb.daysLeft;
  });
}
