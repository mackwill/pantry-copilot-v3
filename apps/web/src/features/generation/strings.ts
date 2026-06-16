import type { BranchAction } from '@pantry/contracts';
import type { IconName } from '@pantry/design-system/web';

/** All board copy for the §01 Home → §04 generating → §02 Result flow. */
export const generationStrings = {
  home: {
    eyebrow: 'Ask in your own words',
    kitchenEyebrow: 'Your kitchen',
    pantrySummary: (total: number, expiring: number): string =>
      `${total.toString()} in pantry · ${expiring.toString()} expiring soon`,
    greeting: (name: string): string => `Hi ${name}.`,
    greetingAccent: 'What are you hungry for?',
    placeholder: 'Something cozy with the milk and carrots, not too sweet…',
    submit: 'Cook this',
    micLabel: 'Voice input',
    suggestions: ["use what's expiring", 'under 20 min', 'one pan', 'something weird', 'kid-friendly'],
    contextWantUsing: 'Want using soon',
    contextRecentlySaved: 'Recently saved',
    pantryLink: 'Pantry →',
    recipesLink: 'Recipes →',
    tryPrefix: 'Try:',
  },
  thinking: {
    backLabel: 'Home',
    cookCrumb: '· cook',
    yourAsk: 'Your ask',
    header: 'Thinking',
    stop: 'Stop',
    footnote: 'recipes will appear below when reasoning settles',
    streamOpen: (elapsed: string): string => `copilot · stream open · ${elapsed}`,
    toolCount: (n: number): string => `${n.toString()} ${n === 1 ? 'tool' : 'tools'}`,
  },
  drafting: {
    eyebrow: 'The pick',
    drafting: 'drafting',
    method: 'Method',
    ingredients: 'Ingredients',
    methodWaiting: 'waiting for ingredients to finish…',
  },
  collapsed: {
    thoughtFor: (elapsed: string): string => `Thought for ${elapsed}`,
    summary: (tools: number): string => `${tools.toString()} tool calls · settled on the pick`,
    showReasoning: 'show reasoning ↓',
  },
  result: {
    backLabel: 'Home',
    cookCrumb: '· cook',
    yourAsk: 'Your ask',
    pick: 'The pick',
    ingredients: 'Ingredients',
    method: 'Method',
    methodSteps: (n: number): string => `Method · ${n.toString()} ${n === 1 ? 'step' : 'steps'}`,
    usesExpiring: (n: number): string => `uses ${n.toString()} expiring`,
    ingredientCount: (n: number): string => `${n.toString()} ingredients`,
    timePill: (min: number): string => `${min.toString()} min`,
    startCooking: 'Start cooking',
    save: 'Save',
    saved: 'Saved',
    share: 'Share',
    usingUp: '· using up',
    fromPantry: '· pantry',
    optional: '· optional',
  },
  branches: {
    eyebrow: 'Not quite it? Try a different angle',
    hint: 'one tap = one re-prompt',
  },
  errors: {
    title: 'That generation hit a snag',
    retry: 'Try again',
    backHome: 'Back home',
    aborted: 'Generation stopped.',
  },
} as const;

/** The four §02 branch tiles — icon, label, subtitle. */
export interface BranchTile {
  action: BranchAction;
  icon: IconName;
  label: string;
  sub: string;
}

export const BRANCH_TILES: readonly BranchTile[] = [
  { action: 'weirder', icon: 'Flame', label: 'Weirder', sub: 'crank weirdness, same constraints' },
  { action: 'faster', icon: 'Timer', label: 'Faster', sub: 'under 15 minutes' },
  { action: 'vegetarian', icon: 'Leaf', label: 'Vegetarian only', sub: 'drop the meat, swap the fat' },
  { action: 'new-angle', icon: 'Shuffle', label: 'Different angle', sub: 'same pantry, totally new direction' },
];
