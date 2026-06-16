import { describe, expect, it } from 'vitest';
import { WEIRDNESS_BANDS, weirdnessBand } from '../index';

describe('WEIRDNESS_BANDS', () => {
  it('exposes the five bands in ascending intensity', () => {
    expect(WEIRDNESS_BANDS).toEqual(['normal', 'curious', 'interesting', 'adventurous', 'chaotic']);
  });
});

describe('weirdnessBand', () => {
  it.each([
    [0, 'normal'],
    [20, 'normal'],
    [21, 'curious'],
    [40, 'curious'],
    [41, 'interesting'],
    [60, 'interesting'],
    [61, 'adventurous'],
    [80, 'adventurous'],
    [81, 'chaotic'],
    [100, 'chaotic'],
  ] as const)('maps score %i to band %s', (score, band) => {
    expect(weirdnessBand(score)).toBe(band);
  });
});
