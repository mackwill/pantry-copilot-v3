import type { RecipeLibraryFilter } from '@pantry/contracts';

/** "today", "3d ago", "2w ago", "4mo ago" from an ISO timestamp. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return 'today';
  if (days < 7) return `${String(days)}d ago`;
  if (days < 30) return `${String(Math.floor(days / 7))}w ago`;
  return `${String(Math.floor(days / 30))}mo ago`;
}

/** Filter pills — All/Saved are data-backed; the rest wait on M6 sessions. */
export interface LibraryFilterTab {
  id: 'all' | 'saved' | 'tonight' | 'cooked' | 'want-to-try';
  label: string;
  filter?: RecipeLibraryFilter;
}

export const LIBRARY_FILTER_TABS: readonly LibraryFilterTab[] = [
  { id: 'all', label: 'All', filter: 'all' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'saved', label: 'Saved', filter: 'favorites' },
  { id: 'cooked', label: 'Cooked' },
  { id: 'want-to-try', label: 'Want to try' },
];

/** All board copy for the mobile §03 Cook library + NewAskSheet. */
export const libraryStrings = {
  eyebrow: 'Cook',
  newButton: 'New',
  headingLead: "What's it",
  headingAccent: 'gonna be?',
  savedCount: (n: number): string => `${String(n)} saved`,
  searchPlaceholder: 'Search recipes',
  noMatches: 'No recipes match your search.',
  sort: {
    eyebrow: 'Sort',
    title: 'Sort recipes',
    recent: 'Most recent',
    alpha: 'Title (A–Z)',
    quickest: 'Quickest first',
  },
  recentEyebrow: 'Recently generated',
  cookNewTitle: 'Cook something new…',
  cookNewSub: 'Ask in your own words · set the weirdness',
  emptyRecent: 'Your generated recipes will appear here.',
  cardTime: (min: number): string => `${String(min)} min`,
  weirdLabel: (weirdness: number): string => {
    if (weirdness >= 70) return 'adventurous';
    if (weirdness >= 40) return 'curious';
    return 'classic';
  },
  cookedTimes: (n: number): string => `cooked ${String(n)}×`,
  relativeTime,
  newAsk: {
    eyebrow: 'New recipe',
    title: 'What are you hungry for?',
    placeholder: 'Something cozy with the milk and carrots, not too sweet…',
    footerHint: 'uses your pantry · ~300 tokens',
    cookThis: 'Cook this',
    tryEyebrow: 'Try',
    suggestions: ["use what's expiring", 'under 20 min', 'one pan', 'something weird', 'kid-friendly'],
  },
} as const;
