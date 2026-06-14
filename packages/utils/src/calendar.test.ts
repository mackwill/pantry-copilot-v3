import { describe, expect, it } from 'vitest';
import { addDays, monthGrid } from './calendar.js';

describe('monthGrid', () => {
  it('pads leading nulls to the first weekday (Sunday-first)', () => {
    // May 1 2026 is a Friday → 5 leading nulls (Sun..Thu), then day 1 at index 5.
    const grid = monthGrid(2026, 4);
    expect(grid.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(grid[5]).toBe(1);
  });

  it('returns a length that is a multiple of 7', () => {
    expect(monthGrid(2026, 4).length % 7).toBe(0);
  });

  it('ends on the last day of the month as the final non-null cell', () => {
    const grid = monthGrid(2026, 4);
    const lastNonNull = [...grid].reverse().find((cell) => cell !== null);
    expect(lastNonNull).toBe(31);
  });

  it('handles a 28-day February', () => {
    const grid = monthGrid(2026, 1);
    const days = grid.filter((cell): cell is number => cell !== null);
    expect(days).toHaveLength(28);
    expect(days[0]).toBe(1);
    expect(days[days.length - 1]).toBe(28);
    expect(grid.length % 7).toBe(0);
  });
});

describe('addDays', () => {
  it('adds days and returns an ISO yyyy-mm-dd string', () => {
    expect(addDays('2026-05-03', 7)).toBe('2026-05-10');
  });

  it('rolls over month boundaries', () => {
    expect(addDays('2026-05-28', 7)).toBe('2026-06-04');
  });

  it('accepts a Date', () => {
    expect(addDays(new Date(Date.UTC(2026, 0, 31)), 1)).toBe('2026-02-01');
  });
});
