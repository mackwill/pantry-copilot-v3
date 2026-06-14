export interface BestByPreset {
  label: string;
  /** Days from today; `null` means "Never" (no best-by date). */
  days: number | null;
}

export const BEST_BY_PRESETS: BestByPreset[] = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
  { label: 'Never', days: null },
];
