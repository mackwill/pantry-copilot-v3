import type { AIRecipe } from '@pantry/contracts';
import type { RawProviderEvent } from './stream-orchestrator.js';

/**
 * The canned recipe the mock streams and finishes on. Deterministic so it
 * backs the §04 Drafting and §02 Result fidelity captures.
 */
export const MOCK_RECIPE: AIRecipe = {
  title: 'Charred Scallion & Carrot Fried Rice',
  summary: 'A fast, savory skillet of day-old rice with sweet carrots and blistered scallions.',
  weirdnessScore: 40,
  ingredients: [
    { name: 'Cooked rice', quantity: 3, unit: 'cup', optional: false, note: 'day-old, cold' },
    { name: 'Scallions', quantity: 1, unit: 'bunch', optional: false, note: 'whites and greens separated' },
    { name: 'Carrots', quantity: 2, unit: 'ea', optional: false, note: 'finely diced' },
    { name: 'Eggs', quantity: 2, unit: 'ea', optional: false, note: 'beaten' },
    { name: 'Butter', quantity: 1, unit: 'tbsp', optional: false, note: null },
    { name: 'Soy sauce', quantity: 2, unit: 'tbsp', optional: true, note: 'to taste' },
  ],
  steps: [
    'Melt the butter in a wide skillet over high heat until it foams.',
    'Add the carrots and scallion whites; cook until the carrots soften at the edges, about 3 minutes.',
    'Push everything aside, pour in the eggs, and scramble until just set.',
    'Add the cold rice and press it flat; let it sit undisturbed until it crackles, then toss.',
    'Stir through the soy sauce and scallion greens; serve while the rice is still steaming.',
  ],
  timeMinutes: 20,
  difficulty: 'easy',
  substitutions: [{ ingredient: 'Soy sauce', suggestion: 'tamari', reason: 'gluten-free swap' }],
  pantryItemsUsed: ['Scallions', 'Carrots', 'Eggs'],
  confidence: 0.86,
  caveats: ['Best with rice that has chilled overnight — fresh rice steams instead of crisping.'],
  whySuggested: 'Puts your about-to-turn scallions front and center alongside the carrots you already have.',
  observation: 'Your scallions are on their way out — this puts them to work tonight.',
};

const THINKING = [
  'Let me look at what is in the pantry and what needs using first. ',
  'Scallions are flagged as expiring, so they should anchor the dish. ',
  'Carrots and eggs pair naturally with them — a fried rice keeps it fast and weeknight-friendly. ',
] as const;

/** Split the recipe JSON into fragments so partials stream realistically. */
function recipeFragments(chunks = 7): RawProviderEvent[] {
  const json = JSON.stringify(MOCK_RECIPE);
  const size = Math.ceil(json.length / chunks);
  const out: RawProviderEvent[] = [];
  for (let i = 0; i < json.length; i += size) {
    out.push({ type: 'recipe_fragment', fragment: json.slice(i, i + size) });
  }
  return out;
}

/**
 * The committed scripted event tape: thinking prose → 3 tool calls →
 * emit_recipe fragments → completed. Frozen so CI orchestrator tests and
 * the streaming fidelity captures are reproducible.
 */
export function mockTape(): RawProviderEvent[] {
  return [
    { type: 'thinking_delta', text: THINKING[0] },
    { type: 'tool_started', id: 'tool-read', name: 'read_pantry', display: 'read_pantry()' },
    { type: 'tool_resolved', id: 'tool-read', name: 'read_pantry', result: '14 items' },
    { type: 'thinking_delta', text: THINKING[1] },
    { type: 'tool_started', id: 'tool-exp', name: 'filter_expiring', display: 'filter_expiring(≤3d)' },
    { type: 'tool_resolved', id: 'tool-exp', name: 'filter_expiring', result: '2 expiring' },
    { type: 'thinking_delta', text: THINKING[2] },
    { type: 'tool_started', id: 'tool-combo', name: 'search_pantry_combos', display: 'search_pantry_combos()' },
    { type: 'tool_resolved', id: 'tool-combo', name: 'search_pantry_combos', result: '5 combos' },
    { type: 'emit_recipe_started', id: 'tool-emit' },
    ...recipeFragments(),
    { type: 'completed', recipe: MOCK_RECIPE, tokensUsed: { input: 0, output: 0 } },
  ];
}
