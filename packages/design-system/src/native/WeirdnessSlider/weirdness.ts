export {
  WEIRDNESS_LABELS,
  weirdnessLabel,
  type WeirdnessLabel,
} from '../../shared/weirdness.js';

export interface GradientStop {
  color: string;
  offset: number;
}

/** Parse `#hex NN%` stops out of a CSS linear-gradient token. */
export function parseGradientStops(gradient: string): GradientStop[] {
  const stops: GradientStop[] = [];
  for (const match of gradient.matchAll(/(#[0-9A-Fa-f]{3,8})\s+([\d.]+)%/g)) {
    const [, color, offset] = match;
    if (color !== undefined && offset !== undefined) {
      stops.push({ color, offset: Number(offset) });
    }
  }
  return stops;
}

/** Convert a touch x offset on the track into a 0–100 slider value. */
export function valueFromTouch(x: number, trackWidth: number): number {
  if (trackWidth <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((x / trackWidth) * 100)));
}

/** Pixel x-offset of the thumb centre for a 0–100 value on a `trackWidth`-px track. */
export function thumbTranslateX(value: number, trackWidth: number): number {
  const clamped = Math.min(100, Math.max(0, value));
  return (clamped / 100) * trackWidth;
}
