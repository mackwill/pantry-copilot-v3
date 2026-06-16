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
