import type { IconName } from '@pantry/design-system/native';

export interface ChatSuggestion {
  icon: IconName;
  label: string;
  prompt: string;
}

export const CHAT_SUGGESTIONS: readonly ChatSuggestion[] = [
  { icon: 'Leaf', label: 'Make it healthier', prompt: 'Make it healthier — less oil, more greens if you can.' },
  { icon: 'Flame', label: 'Make it spicier', prompt: 'Make it spicier.' },
  { icon: 'Snowflake', label: 'Make it less spicy', prompt: 'Make it less spicy.' },
  { icon: 'Users', label: 'Half the servings', prompt: 'Half the servings.' },
];

/** All board copy for the §✦ mobile recipe co-pilot. */
export const recipeChatStrings = {
  tweakButton: 'Tweak this recipe',
  entryTitle: 'Want this a different way?',
  panelTitle: 'Recipe co-pilot',
  tweaksLine: (n: number): string => `${String(n)} ${n === 1 ? 'tweak' : 'tweaks'} · tap to undo`,
  threadStart: '— Started from the original recipe —',
  revert: 'Revert to original',
  composerPlaceholder: 'Try: "no nuts, kid\'s allergy"',
  thinking: 'Thinking…',
  errorPrefix: "Couldn't apply that — ",
  addedLabel: '· added by tweak',
  editedLabel: '· edited',
} as const;
