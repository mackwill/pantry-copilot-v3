import type { BranchAction } from '@pantry/contracts';
import type { IconName } from '@pantry/design-system/native';

/** All board copy for the mobile §01 Home → §04 generating → §02 Result flow. */
export const generationStrings = {
  home: {
    greeting: (name: string): string => `Hi, ${name}`,
    eyebrow: 'Your kitchen',
    avatarInitials: 'MS',
    headingLead: 'What are you',
    headingAccent: 'hungry for?',
    placeholder: 'Something cozy with milk and carrots…',
    submit: 'Cook this',
    suggestions: ["use what's expiring", 'under 20 min'],
    tapToAdd: 'Tap to add · expiring',
    browsePantry: (n: number): string => `Browse pantry · ${n.toString()}`,
    cookingWith: 'Cooking with',
    notePlaceholder: 'add a note, or just hit cook…',
    readySummary: (n: number): string => `${n.toString()} from pantry · ready`,
    recentlySaved: 'Recently saved',
    recentlySavedAll: 'All →',
    recentEmpty: 'Your saved recipes will appear here.',
  },
  sheet: {
    eyebrow: 'Cook with',
    titleLead: 'Pick from ',
    titleAccent: 'everything',
    searchPlaceholder: 'Search your pantry…',
    itemCount: (n: number): string => `${n.toString()} items`,
    needsUsing: 'Needs using',
    needsUsingSub: 'expiring this week',
    fridge: 'Fridge',
    pantry: 'Pantry',
    selectedCount: (n: number): string => `${n.toString()} selected`,
    addToPrompt: 'Add to prompt',
    close: 'Close',
  },
  filters: ['All', 'Expiring', 'Fridge', 'Pantry', 'Produce', 'Dairy'],
  thinking: {
    close: 'Close',
    streamElapsed: (elapsed: string): string => `stream · ${elapsed}`,
    yourAsk: 'Your ask',
    header: 'Thinking',
    stop: 'Stop',
    toolCount: (n: number): string => `${n.toString()} ${n === 1 ? 'tool' : 'tools'}`,
  },
  drafting: {
    thoughtFor: (elapsed: string): string => `Thought for ${elapsed}`,
    eyebrow: 'The pick',
    drafting: 'drafting',
    ingredients: 'Ingredients',
    methodWaiting: 'waiting for ingredients to finish…',
  },
  result: {
    yourAsk: 'Your ask',
    thoughtFor: (elapsed: string): string => `Thought for ${elapsed}`,
    pick: 'The pick',
    usesExpiring: (n: number): string => `uses ${n.toString()} expiring`,
    ingredientCount: (n: number): string => `Ingredients · ${n.toString()}`,
    timeMeta: (min: number): string => `${min.toString()} min`,
    startCooking: 'Start cooking',
    save: 'Save',
    usingUp: '· using up',
    optional: '· optional',
  },
  branches: {
    eyebrow: 'Not quite it? Try a different angle',
  },
  errors: {
    title: 'That generation hit a snag',
    retry: 'Try again',
    backHome: 'Back home',
    aborted: 'Generation stopped.',
  },
} as const;

/** The four §02 branch tiles (mobile 2×2 grid) — icon, label. */
export interface BranchTile {
  action: BranchAction;
  icon: IconName;
  label: string;
}

/**
 * Native icon set lacks the board's timer/shuffle glyphs, so Faster maps to
 * `Clock` and New angle to `RefreshCw` (logged in docs/decisions.md).
 */
export const BRANCH_TILES: readonly BranchTile[] = [
  { action: 'weirder', icon: 'Flame', label: 'Weirder' },
  { action: 'faster', icon: 'Clock', label: 'Faster (< 15)' },
  { action: 'vegetarian', icon: 'Leaf', label: 'Vegetarian' },
  { action: 'new-angle', icon: 'RefreshCw', label: 'New angle' },
];
