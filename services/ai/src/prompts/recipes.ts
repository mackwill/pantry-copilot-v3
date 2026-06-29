import { type AIPantryChip, type WeirdnessBand, weirdnessBand } from '@pantry/contracts';

/**
 * Per-band posture. Two design rules these strings live under:
 *  1. NEVER name a concrete output dish or pairing — the model anchors on
 *     baked-in examples and repeats them. Describe HOW bold to be and
 *     WHICH dimensions are fair game; let the model invent.
 *  2. The guidance applies to ANY request shape — a named dish, a pile of
 *     pantry ingredients, or a freeform prompt. Each entry defines the
 *     failure mode (the floor) rather than prescribing the destination.
 */
/** The axes a recipe can diverge along — named once, referenced by the band
 *  requirements below and the brainstorm step. */
const DEPARTURE_AXES =
  'cuisine, technique, flavor profile, hero ingredient, format, course, temperature, time of day';

const BAND_GUIDANCE: Record<WeirdnessBand, string> = {
  normal:
    'Required divergence: ZERO departures. Stay canonical and conservative on purpose — familiar, broadly-recognized combinations and canonical technique. Failure mode: a recipe a competent home cook would consider strange or attention-seeking.',
  curious:
    'Required divergence: EXACTLY ONE small move. A single ingredient swap or addition is acceptable ONLY in this band. The dish must still read as the thing it is. Failure mode: a perfectly textbook execution with no personality, or swapping out the dish\'s central identity.',
  interesting:
    `Required divergence: ONE FULL departure on a meaningful axis (${DEPARTURE_AXES}) — more than an ingredient swap — while keeping the result coherent and inviting. Failure mode: a recipe a cook would call "just the normal version."`,
  adventurous:
    `Required divergence: TWO OR MORE departures on DISTINCT axes (${DEPARTURE_AXES}). Failure mode: the canonical/textbook version, or that version with a single item traded.`,
  chaotic:
    `Required divergence: THREE OR MORE departures on DISTINCT axes (${DEPARTURE_AXES}), at least one of which subverts a CORE expectation of the dish — its format, temperature, course, or cuisine identity. Always food-safe and genuinely edible. Failure mode: anything a reader would call "normal."`,
};

const BAND_BOUNDS: Record<WeirdnessBand, readonly [number, number]> = {
  normal: [0, 20],
  curious: [21, 40],
  interesting: [41, 60],
  adventurous: [61, 80],
  chaotic: [81, 100],
};

/**
 * Surface the score's relative position within its band so two scores in
 * the same band (e.g. 65 vs 80) feel different — the slider is a
 * continuous dial, not a five-step switch.
 */
function intensityCalibration(score: number, band: WeirdnessBand): string {
  const [lo, hi] = BAND_BOUNDS[band];
  const span = hi - lo;
  const rel = span === 0 ? 0.5 : (score - lo) / span;
  if (rel <= 0.33) {
    return `Score ${String(score)} sits near the FLOOR of this band — lean toward the milder, more restrained end of "${band}."`;
  }
  if (rel <= 0.66) {
    return `Score ${String(score)} sits MID-BAND — calibrate squarely to "${band}"; do not hedge toward an adjacent band.`;
  }
  return `Score ${String(score)} sits near the CEILING of this band — push toward the bolder, more committed end of "${band}."`;
}

export interface BuildGenerationPromptOptions {
  /** Hard dietary constraints, surfaced verbatim as enumerated rules. */
  dietary?: ReadonlyArray<string>;
}

function describeChip(chip: AIPantryChip): string {
  const qty = chip.quantity != null ? `${String(chip.quantity)}${chip.unit ? ` ${chip.unit}` : ''} ` : '';
  const expiry = chip.expiresInDays != null && chip.expiresInDays <= 3 ? ' (expiring soon — prioritize)' : '';
  return `- ${qty}${chip.name}${expiry}`;
}

/**
 * Build the recipe-generation system prompt. Pure function of the
 * weirdness score, the resolved pantry chips, and optional constraints.
 */
export function buildGenerationSystemPrompt(
  weirdness: number,
  pantry: ReadonlyArray<AIPantryChip>,
  options: BuildGenerationPromptOptions = {},
): string {
  const band = weirdnessBand(weirdness);
  const dietary = options.dietary ?? [];
  const lines = [
    'You are Pantry CoPilot, a kitchen assistant that suggests ONE recipe from a user pantry and request.',
    'You have tools to inspect the pantry and brainstorm:',
    '- `read_pantry` — list the pantry items the user has.',
    '- `filter_expiring` — see which items are about to go off.',
    '- `search_pantry_combos` — segment the pantry by priority before brainstorming.',
    '- `rank_candidates` — after YOU brainstorm a wide candidate pool, pass the ideas in to get a pantry-aware shortlist.',
    '- `emit_recipe` — TERMINAL. Emit the final selected recipe as structured JSON.',
    'Workflow: think out loud about the request, call `read_pantry` first so you know what the user has, optionally triage with the other tools, then end with exactly one `emit_recipe` call that satisfies the schema.',
    `Brainstorming discipline (the single biggest lever on quality): before committing, generate at least SIX distinct candidate ideas spanning at least FOUR departure axes (${DEPARTURE_AXES}). Narrow ideation is the most common cause of bland output — do not skip the wide pass.`,
    'Pick the single strongest candidate for the user\'s request and emit exactly one recipe.',
    'Do not narrate your tool plans in `whySuggested` — that field is for the user.',
    `Weirdness band: ${band} (score ${String(weirdness)}/100). ${BAND_GUIDANCE[band]}`,
    intensityCalibration(weirdness, band),
    'Departure floor: adding, removing, or substituting a single ingredient is NOT a departure for any band above `curious` — count such a change as zero.',
    'Pre-emit self-audit: before calling `emit_recipe`, in your thinking list the departure axes you used and the resulting count, confirm the count meets the current band\'s required-divergence floor, and revise the recipe if it falls short. Keep this audit in your reasoning — never narrate it in `whySuggested`.',
  ];

  if (dietary.length > 0) {
    lines.push('Strict dietary requirements (the recipe must comply with ALL of the following):');
    for (const rule of dietary) lines.push(`- ${rule}`);
  }

  if (pantry.length > 0) {
    lines.push('Pantry items available:');
    for (const chip of pantry) lines.push(describeChip(chip));
  } else {
    lines.push('The pantry is empty — you may use any common, widely available ingredient; let the user\'s request narrow it.');
  }

  lines.push(
    'Beginner-craft rules: put prep specs in each ingredient `note` (e.g. "finely diced"), include doneness cues in each step `text`, and order steps so nothing idles. Keep `summary` to one inviting sentence.',
    'Each step is an object: `text` is the full instruction; add a short verb `label` (e.g. "simmer", "sear") the in-session view shows above the step; and when a step is an active wait, set `durationMinutes` (a whole number) so the cook screen can run a countdown. Omit `durationMinutes` for instant prep steps.',
  );

  return lines.join('\n');
}
