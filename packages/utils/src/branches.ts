import type { BranchAction, GenerationRequest } from '@pantry/contracts';

/**
 * Branch tiles on the §02 Result screen are one-tap re-prompts: each
 * transforms the previous `GenerationRequest` into a new one, then the
 * hook re-runs the same generate path. Helpers are idempotent so
 * spamming the same tile doesn't compound the suffix.
 */
const WEIRDER_BUMP = 20;

const BRANCH_SUFFIX: Record<BranchAction, string> = {
  // `weirder` bumps weirdness AND nudges the prompt — a +20 score change
  // often stays within the same band, so without the nudge the model
  // tends to return a near-identical recipe.
  weirder: 'make this weirder, more unusual, different from before',
  faster: 'under 15 minutes',
  vegetarian: 'vegetarian only',
  'new-angle': 'a totally different direction than last time',
};

function appendOnce(prompt: string, suffix: string): string {
  const base = prompt.trim();
  if (base.toLowerCase().includes(suffix.toLowerCase())) return base;
  return base.length > 0 ? `${base} — ${suffix}` : suffix;
}

export function buildBranchInput(base: GenerationRequest, action: BranchAction): GenerationRequest {
  const prompt = appendOnce(base.prompt, BRANCH_SUFFIX[action]);
  if (action === 'weirder') {
    return { ...base, prompt, weirdness: Math.min(100, base.weirdness + WEIRDER_BUMP) };
  }
  return { ...base, prompt };
}
