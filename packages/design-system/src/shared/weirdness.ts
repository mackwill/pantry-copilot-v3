// Single source of truth lives in @pantry/contracts. The hardcoded 4-label
// list and 25/55/85 cutoffs that used to live here were a duplicate of the
// band system that actually drives the generation prompt — deleted.
export {
  WEIRDNESS_BAND_LABELS as WEIRDNESS_LABELS,
  weirdnessLabel,
  type WeirdnessLabel,
} from '@pantry/contracts';
