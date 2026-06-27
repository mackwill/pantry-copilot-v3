/** "just now", "3d ago", "2w ago", "4mo ago" from an ISO timestamp. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return 'just now';
  if (days < 7) return `${String(days)}d ago`;
  if (days < 30) return `${String(Math.floor(days / 7))}w ago`;
  return `${String(Math.floor(days / 30))}mo ago`;
}

/** All board copy for the §05/§07 web recipe detail. */
export const recipeDetailStrings = {
  back: 'Back to recipes',
  generatedPrefix: '· generated ',
  generatedFrom: ' from your pantry',
  save: 'Save',
  saved: 'Saved',
  share: 'Share',
  metaEyebrow: (difficulty: string, min: number): string => `${difficulty} · ${String(min)} min`,
  metaTime: 'time',
  metaServes: 'serves',
  metaEffort: 'effort',
  metaCost: 'cost',
  metaCal: 'cal/serve',
  timeValue: (min: number): string => `${String(min)} min`,
  /** Board-fixture placeholders — no per-recipe nutrition/cost data in M5 (decision E). */
  servesPlaceholder: '2',
  costPlaceholder: '$3.40',
  calPlaceholder: '420',
  method: 'Method',
  copilotTitle: 'Notes from the copilot',
  ingredientsEyebrow: (servings: string): string => `Ingredients · ${servings} servings`,
  inPantryPill: (have: number, total: number): string => `${String(have)} of ${String(total)} in pantry`,
  startCooking: 'Start cooking',
  couldAlsoUse: 'Could also use',
  substitutionPrefix: '+ ',
  relativeTime,
} as const;
