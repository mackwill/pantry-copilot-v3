export const WEIRDNESS_LABELS = ['normal', 'curious', 'adventurous', 'chaotic evil'] as const;

export type WeirdnessLabel = (typeof WEIRDNESS_LABELS)[number];

export function weirdnessLabel(value: number): WeirdnessLabel {
  if (value < 25) return WEIRDNESS_LABELS[0];
  if (value < 55) return WEIRDNESS_LABELS[1];
  if (value < 85) return WEIRDNESS_LABELS[2];
  return WEIRDNESS_LABELS[3];
}
