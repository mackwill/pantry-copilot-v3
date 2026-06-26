import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { normalizeForDiff } from './normalize';

describe('normalizeForDiff', () => {
  it('scales a larger actual down to the reference width before diffing', () => {
    const ref = new PNG({ width: 780, height: 1602 });
    const act = new PNG({ width: 1178, height: 2556 }); // native iPhone screenshot
    const out = normalizeForDiff(ref, act);
    expect(out.w).toBe(780); // compare at reference width
    expect(out.act.width).toBe(780); // actual was resized, not just padded
    expect(out.h).toBe(Math.max(1602, out.act.height)); // height padded to tallest
  });

  it('is a no-op when dimensions already match (web frames)', () => {
    const ref = new PNG({ width: 2560, height: 1722 });
    const act = new PNG({ width: 2560, height: 1722 });
    const out = normalizeForDiff(ref, act);
    expect(out.w).toBe(2560);
    expect(out.h).toBe(1722);
  });
});
