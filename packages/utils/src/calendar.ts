const DAY_MS = 86_400_000;

/**
 * Flat calendar cells for a month (Sunday-first): leading `null`s pad to the
 * first day's weekday, day-of-month numbers fill the middle, trailing `null`s
 * complete the final week. Length is always a multiple of 7.
 */
export function monthGrid(year: number, monthIndex: number): (number | null)[] {
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  // Day 0 of the next month resolves to the last day of this month.
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toUtcMs(date: string | Date): number {
  if (date instanceof Date) return date.getTime();
  return new Date(`${date}T00:00:00Z`).getTime();
}

/** Adds `n` days to an ISO date (or Date) and returns a `yyyy-mm-dd` string. */
export function addDays(date: string | Date, n: number): string {
  const result = new Date(toUtcMs(date) + n * DAY_MS);
  return result.toISOString().slice(0, 10);
}
