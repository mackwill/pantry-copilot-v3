import { describe, expect, it } from 'vitest';
import {
  WEIRDNESS_BAND_LABEL,
  WEIRDNESS_BAND_LABELS,
  WEIRDNESS_BANDS,
  weirdnessBand,
  weirdnessLabel,
} from '../index';

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

describe('WEIRDNESS_BAND_LABELS', () => {
  it('lists the five display words in ascending intensity', () => {
    expect(WEIRDNESS_BAND_LABELS).toEqual([
      'normal',
      'curious',
      'interesting',
      'adventurous',
      'chaotic evil',
    ]);
  });
});

describe('WEIRDNESS_BAND_LABEL', () => {
  it('is identity for every band except chaotic → "chaotic evil"', () => {
    expect(WEIRDNESS_BAND_LABEL.normal).toBe('normal');
    expect(WEIRDNESS_BAND_LABEL.curious).toBe('curious');
    expect(WEIRDNESS_BAND_LABEL.interesting).toBe('interesting');
    expect(WEIRDNESS_BAND_LABEL.adventurous).toBe('adventurous');
    expect(WEIRDNESS_BAND_LABEL.chaotic).toBe('chaotic evil');
  });
});

describe('weirdnessLabel', () => {
  it.each([
    [0, 'normal'],
    [20, 'normal'],
    [21, 'curious'],
    [40, 'curious'],
    [41, 'interesting'],
    [60, 'interesting'],
    [61, 'adventurous'],
    [80, 'adventurous'],
    [81, 'chaotic evil'],
    [100, 'chaotic evil'],
  ] as const)('maps score %i to label %s', (score, label) => {
    expect(weirdnessLabel(score)).toBe(label);
  });
});
