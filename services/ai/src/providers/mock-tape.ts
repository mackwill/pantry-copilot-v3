import type { AIRecipe, RecipeTweakResponse } from '@pantry/contracts';
import type { RawProviderEvent } from './stream-orchestrator.js';
import type { RawTweakEvent } from './tweak-orchestrator.js';

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
    { text: 'Melt the butter in a wide skillet over high heat until it foams.', label: 'melt', durationMinutes: 2 },
    {
      text: 'Add the carrots and scallion whites; cook until the carrots soften at the edges, about 3 minutes.',
      label: 'sauté',
      durationMinutes: 3,
    },
    { text: 'Push everything aside, pour in the eggs, and scramble until just set.', label: 'scramble', durationMinutes: 1 },
    {
      text: 'Add the cold rice and press it flat; let it sit undisturbed until it crackles, then toss.',
      label: 'crisp',
      durationMinutes: 4,
    },
    { text: 'Stir through the soy sauce and scallion greens; serve while the rice is still steaming.', label: 'finish' },
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

/**
 * The canned tweak the mock streams: a "lighter, more greens" pass over
 * MOCK_RECIPE — halved butter (edited) + a handful of spinach (added).
 * Deterministic so it backs the §✦ chat fidelity captures and the e2e tape.
 */
export const MOCK_TWEAK_RESPONSE: RecipeTweakResponse = {
  summary: 'Lighter on the butter, with a handful of greens stirred through at the end.',
  changes: [
    { tag: 'change', text: 'Halved the butter to 1 tsp' },
    { tag: 'add', text: 'Added a big handful of spinach' },
    { tag: 'note', text: 'Greens go in last so they keep their color' },
  ],
  updatedRecipe: {
    ...MOCK_RECIPE,
    title: 'Charred Scallion & Carrot Fried Rice with Greens',
    ingredients: [
      ...MOCK_RECIPE.ingredients.map((i) =>
        i.name === 'Butter' ? { ...i, quantity: 1, unit: 'tsp', edited: true } : i,
      ),
      { name: 'Baby spinach', quantity: 2, unit: 'cup', optional: false, note: 'roughly chopped', added: true },
    ],
    steps: [
      ...MOCK_RECIPE.steps.slice(0, -1),
      {
        text: 'Stir through the soy sauce, scallion greens, and spinach; toss just until the spinach wilts, then serve.',
        label: 'finish',
      },
    ],
  },
};

/** Split the tweak JSON so the summary, then the recipe, stream realistically. */
function tweakFragments(chunks = 8): RawTweakEvent[] {
  const json = JSON.stringify(MOCK_TWEAK_RESPONSE);
  const size = Math.ceil(json.length / chunks);
  const out: RawTweakEvent[] = [];
  for (let i = 0; i < json.length; i += size) {
    out.push({ type: 'tweak_fragment', fragment: json.slice(i, i + size) });
  }
  return out;
}

/** The committed scripted tweak tape: emit_tweak fragments → completed. */
export function mockTweakTape(): RawTweakEvent[] {
  return [...tweakFragments(), { type: 'completed', response: MOCK_TWEAK_RESPONSE, tokensUsed: { input: 0, output: 0 } }];
}
