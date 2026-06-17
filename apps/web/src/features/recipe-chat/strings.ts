import type { IconName } from '@pantry/design-system/web';

/** Entry suggestion chips — 1-tap prompts that open the panel pre-filled. */
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

/** All board copy for the §✦ web recipe co-pilot. */
export const recipeChatStrings = {
  back: 'Back to recipe',
  tweakButton: 'Tweak this recipe',
  entryPrompt: 'Want this a different way? Ask the copilot —',
  panelTitle: 'Recipe co-pilot',
  panelTweaking: 'Tweaking ',
  threadStart: '— Started from the original recipe —',
  versionPrefix: 'v',
  versionDot: '·',
  tweaksSuffix: (n: number): string => `${String(n)} ${n === 1 ? 'tweak' : 'tweaks'}`,
  revert: 'Revert to original',
  composerPlaceholder: 'Try: "no nuts, kid\'s allergy"',
  sendLabel: 'Send tweak',
  thinking: 'Thinking…',
  errorPrefix: "Couldn't apply that — ",
  addedLabel: '· added by tweak',
  editedLabel: '· edited',
  ingredientsEyebrow: (servings: string): string => `Ingredients · ${servings} servings`,
  method: 'Method',
} as const;
