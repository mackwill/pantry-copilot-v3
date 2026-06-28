export const pantryStrings = {
  eyebrow: 'Pantry',
  title: "What's in?",
  subtitleLead: 'tap anything to cook with it · ',
  expiringSuffix: (n: number): string => `${String(n)} expiring soon`,
  needsUsing: 'Needs using',
  fresh: 'Fresh',
  cookWith: (n: number): string => `Cook with ${String(n)}`,
  cook: 'Cook',
  searchPlaceholder: 'Search your pantry',
  noMatches: 'Nothing matches your search.',
  filter: {
    eyebrow: 'Filter',
    title: 'Show only',
    all: 'All categories',
  },
} as const;
