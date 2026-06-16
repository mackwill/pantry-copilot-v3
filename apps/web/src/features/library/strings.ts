import type { RecipeLibraryFilter } from '@pantry/contracts';

/** "today", "3d ago", "2w ago", "4mo ago" from an ISO timestamp. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return 'today';
  if (days < 7) return `${String(days)}d ago`;
  if (days < 30) return `${String(Math.floor(days / 7))}w ago`;
  return `${String(Math.floor(days / 30))}mo ago`;
}

/** Filter pills — the data-backed subset is enabled; the rest wait on M6 sessions. */
export interface LibraryFilterTab {
  id: RecipeLibraryFilter | 'tonight' | 'cooked' | 'want-to-try';
  label: string;
  /** Enabled filters map to a server filter; disabled pills wait on M6 sessions. */
  filter?: RecipeLibraryFilter;
}

export const LIBRARY_FILTER_TABS: readonly LibraryFilterTab[] = [
  { id: 'all', label: 'All', filter: 'all' },
  { id: 'favorites', label: 'Favorites', filter: 'favorites' },
  { id: 'recent', label: 'Recent', filter: 'recent' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'cooked', label: 'Cooked' },
  { id: 'want-to-try', label: 'Want to try' },
];

/** All board copy for the §03 web recipe library (Cook · empty + populated). */
export const libraryStrings = {
  eyebrow: 'Cook',
  headlineLead: 'Nothing on the stove',
  headlineAccent: 'right now.',
  subheadLead: 'When you tap ',
  subheadAction: 'Start cooking',
  subheadTail: ' on any recipe, this is where the step-by-step view lives.',
  pickEyebrow: 'Pick from your library',
  savedCount: (n: number): string => `${String(n)} saved ${n === 1 ? 'recipe' : 'recipes'}`,
  pickSub: 'Open the full library',
  cookNewEyebrow: 'Cook something new',
  cookNewTitle: 'Ask in your own words…',
  cookNewSub: 'Opens the prompt · set the weirdness',
  recentEyebrow: 'Recently generated',
  filterDisabledHint: 'Available once cook sessions land (M6)',
  cardTimePill: (min: number): string => `${String(min)} min`,
  weirdLabel: (weirdness: number): string => {
    if (weirdness >= 70) return 'adventurous';
    if (weirdness >= 40) return 'curious';
    return 'classic';
  },
  difficultyLabel: (difficulty: string): string => difficulty,
  savedBadge: 'Saved',
  relativeTime,
} as const;
