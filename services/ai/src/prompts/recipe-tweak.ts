import type { AIRecipe, AITweakTurn } from '@pantry/contracts';

function describeRecipe(recipe: AIRecipe): string {
  const ingredients = recipe.ingredients
    .map((i) => {
      const qty = i.quantity != null ? `${String(i.quantity)}${i.unit ? ` ${i.unit}` : ''} ` : '';
      const note = i.note ? ` (${i.note})` : '';
      return `- ${qty}${i.name}${note}`;
    })
    .join('\n');
  const steps = recipe.steps.map((s, idx) => `${String(idx + 1)}. ${s.text}`).join('\n');
  return [
    `Title: ${recipe.title}`,
    `Summary: ${recipe.summary}`,
    `Time: ${String(recipe.timeMinutes)} min · Difficulty: ${recipe.difficulty}`,
    'Ingredients:',
    ingredients,
    'Steps:',
    steps,
  ].join('\n');
}

function describePriorTurns(priorTurns: ReadonlyArray<AITweakTurn>): string[] {
  if (priorTurns.length === 0) return [];
  const lines = ['Prior tweaks already applied to this recipe (most recent last):'];
  for (const turn of priorTurns) {
    lines.push(`- The cook asked: "${turn.userMessage}" → ${turn.summary}`);
  }
  lines.push(
    'The recipe shown above ALREADY reflects those tweaks — build on it; do not re-apply or undo them unless the new request says so.',
  );
  return lines;
}

/**
 * Build the recipe-tweak system prompt. Pure function of the current recipe
 * and the ordered prior turns. The model makes minimal, targeted edits and
 * ends with exactly one `emit_tweak` call.
 */
export function buildTweakSystemPrompt(recipe: AIRecipe, priorTurns: ReadonlyArray<AITweakTurn> = []): string {
  const lines = [
    'You are Pantry CoPilot in recipe co-pilot mode. The cook is looking at a saved recipe and wants to change it in plain language ("less oil, more greens", "make it kid-friendly", "half the servings").',
    'Make MINIMAL, TARGETED edits that satisfy the request and nothing more. Preserve the recipe\'s identity, every untouched ingredient, and every untouched step verbatim — do not rewrite the whole recipe.',
    'Reflect every edit in the full updated recipe you return, keeping it valid and coherent (quantities, steps, and notes stay consistent with the change).',
    'Flag provenance on the ingredients you touch: set `edited: true` on an ingredient you changed (quantity, unit, or note) and `added: true` on an ingredient you introduced. Leave both unset on untouched ingredients. When you remove an ingredient, drop it from the list and record it as a `remove` change.',
    'Summarize the result in ONE short sentence (`summary`), and list each concrete change as a chip in `changes` (1–8 of them): tag `change` for an altered ingredient/step, `add` for something new, `remove` for something dropped, `note` for a heads-up or tip. Keep each chip text under ~12 words.',
    'End with exactly one `emit_tweak` call that satisfies the schema. Do not narrate your process anywhere the cook will read it.',
    '',
    'Current recipe:',
    describeRecipe(recipe),
  ];
  const prior = describePriorTurns(priorTurns);
  if (prior.length > 0) {
    lines.push('', ...prior);
  }
  return lines.join('\n');
}

/** The user turn: the cook's plain-language tweak request. */
export function buildTweakUserMessage(prompt: string): string {
  return prompt;
}
