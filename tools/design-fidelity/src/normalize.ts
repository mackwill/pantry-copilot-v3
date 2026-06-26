// Normalizes a reference/actual PNG pair to a common canvas before diffing.
//
// Why: the mobile references are the board's stylized device element
// (e.g. 780×1602) while a real iOS simulator screenshot is ~1178×2556. The
// old sweep padded both to the max W×H, so the actual's content sat at a
// different scale than the reference — yielding a ~60% pixelmatch from scale
// alone, not fidelity. We instead scale the actual to the reference width
// (preserving aspect — the board device is a different aspect than a real
// iPhone, so stretching to the exact reference height would inject false
// drift), then pad both to the tallest height. Web frames already share dims,
// so this is a no-op for them.
import { PNG } from 'pngjs';

export interface Normalized {
  ref: PNG;
  act: PNG;
  w: number;
  h: number;
}

/** Copy `src` onto a fresh w×h canvas (top-left), leaving any extra as zeros. */
function pad(src: PNG, w: number, h: number): PNG {
  if (src.width === w && src.height === h) return src;
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(src, out, 0, 0, src.width, src.height, 0, 0);
  return out;
}

/** Bilinear-resample `src` to `targetW`, preserving aspect ratio. */
function resizeToWidth(src: PNG, targetW: number): PNG {
  if (src.width === targetW) return src;
  const targetH = Math.round((src.height * targetW) / src.width);
  const out = new PNG({ width: targetW, height: targetH });
  const xRatio = src.width / targetW;
  const yRatio = src.height / targetH;

  for (let y = 0; y < targetH; y += 1) {
    const sy = Math.min(src.height - 1, Math.max(0, (y + 0.5) * yRatio - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(src.height - 1, y0 + 1);
    const wy = sy - y0;
    for (let x = 0; x < targetW; x += 1) {
      const sx = Math.min(src.width - 1, Math.max(0, (x + 0.5) * xRatio - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(src.width - 1, x0 + 1);
      const wx = sx - x0;
      const di = (y * targetW + x) * 4;
      for (let c = 0; c < 4; c += 1) {
        const p00 = src.data[(y0 * src.width + x0) * 4 + c] ?? 0;
        const p10 = src.data[(y0 * src.width + x1) * 4 + c] ?? 0;
        const p01 = src.data[(y1 * src.width + x0) * 4 + c] ?? 0;
        const p11 = src.data[(y1 * src.width + x1) * 4 + c] ?? 0;
        const top = p00 * (1 - wx) + p10 * wx;
        const bot = p01 * (1 - wx) + p11 * wx;
        out.data[di + c] = Math.round(top * (1 - wy) + bot * wy);
      }
    }
  }
  return out;
}

/**
 * Bring `ref` and `act` onto a shared canvas: scale `act` to the reference
 * width (aspect-preserved), then pad both to the tallest height. Equal-width
 * inputs (web frames) only get the height pad.
 */
export function normalizeForDiff(ref: PNG, act: PNG): Normalized {
  const scaledAct = ref.width === act.width ? act : resizeToWidth(act, ref.width);
  const w = ref.width;
  const h = Math.max(ref.height, scaledAct.height);
  return { ref: pad(ref, w, h), act: pad(scaledAct, w, h), w, h };
}
