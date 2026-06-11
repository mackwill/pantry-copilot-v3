import { describe, expect, it } from 'vitest';
import { tokens } from '../../tokens/native.js';
import { parseGradientStops, valueFromTouch, weirdnessLabel } from './weirdness.js';

describe('weirdnessLabel', () => {
  it('maps values to the design vocabulary at breakpoints 25/55/85', () => {
    expect(weirdnessLabel(0)).toBe('normal');
    expect(weirdnessLabel(24)).toBe('normal');
    expect(weirdnessLabel(25)).toBe('curious');
    expect(weirdnessLabel(54)).toBe('curious');
    expect(weirdnessLabel(55)).toBe('adventurous');
    expect(weirdnessLabel(84)).toBe('adventurous');
    expect(weirdnessLabel(85)).toBe('chaotic evil');
    expect(weirdnessLabel(100)).toBe('chaotic evil');
  });
});

describe('parseGradientStops', () => {
  it('extracts the four stops of the weirdness gradient token', () => {
    expect(parseGradientStops(tokens.weirdGradient)).toEqual([
      { color: '#D8E6B8', offset: 0 },
      { color: '#A4C46B', offset: 35 },
      { color: '#4F6B2E', offset: 70 },
      { color: '#2B3B6E', offset: 100 },
    ]);
  });
});

describe('valueFromTouch', () => {
  it('converts a touch x position to a 0-100 value', () => {
    expect(valueFromTouch(50, 200)).toBe(25);
    expect(valueFromTouch(200, 200)).toBe(100);
    expect(valueFromTouch(0, 200)).toBe(0);
  });

  it('clamps outside the track and guards a zero width', () => {
    expect(valueFromTouch(-10, 200)).toBe(0);
    expect(valueFromTouch(260, 200)).toBe(100);
    expect(valueFromTouch(50, 0)).toBe(0);
  });
});
