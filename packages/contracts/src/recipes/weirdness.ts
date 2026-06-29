import type { WeirdnessBand } from './enums';

/**
 * Deterministic score → band mapping (for prompt calibration):
 *   0–20 normal · 21–40 curious · 41–60 interesting · 61–80 adventurous · 81–100 chaotic
 */
export function weirdnessBand(score: number): WeirdnessBand {
  if (score <= 20) return 'normal';
  if (score <= 40) return 'curious';
  if (score <= 60) return 'interesting';
  if (score <= 80) return 'adventurous';
  return 'chaotic';
}

/** Ordered slider display words, one per band (ascending intensity). */
export const WEIRDNESS_BAND_LABELS = [
  'normal',
  'curious',
  'interesting',
  'adventurous',
  'chaotic evil',
] as const;

export type WeirdnessLabel = (typeof WEIRDNESS_BAND_LABELS)[number];

/** Band → slider display word. Identity except `chaotic` → "chaotic evil". */
export const WEIRDNESS_BAND_LABEL: Record<WeirdnessBand, WeirdnessLabel> = {
  normal: 'normal',
  curious: 'curious',
  interesting: 'interesting',
  adventurous: 'adventurous',
  chaotic: 'chaotic evil',
};

/** Score → slider display word, via the band mapping. */
export function weirdnessLabel(score: number): WeirdnessLabel {
  return WEIRDNESS_BAND_LABEL[weirdnessBand(score)];
}
