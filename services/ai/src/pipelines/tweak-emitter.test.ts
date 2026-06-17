import { describe, expect, it } from 'vitest';
import { TweakEmitter } from './tweak-emitter.js';

const FULL_RECIPE = {
  title: 'Soup',
  summary: 'warm',
  weirdnessScore: 10,
  ingredients: [{ name: 'Water', added: true }],
  steps: ['Boil'],
  timeMinutes: 5,
  difficulty: 'easy',
  whySuggested: 'cozy',
};

const FULL_TWEAK = JSON.stringify({
  summary: 'Lighter and greener.',
  changes: [{ tag: 'add', text: 'Added water' }],
  updatedRecipe: FULL_RECIPE,
});

describe('TweakEmitter', () => {
  it('surfaces the summary (once its value closes) before the recipe arrives', () => {
    const e = new TweakEmitter(0);
    // Mid-string the tolerant parser yields nothing — the summary only
    // surfaces once its closing quote lands, then ahead of the recipe body.
    expect(e.feed('{"summary":"Lighter', 0)).toBeNull();
    const snap = e.feed(' and greener.","changes":[]', 1);
    expect(snap?.summary).toBe('Lighter and greener.');
    expect(snap?.recipe).toBeNull();
  });

  it('throttles emissions within the window', () => {
    const e = new TweakEmitter(180);
    expect(e.feed('{"summary":"Lighter"', 0)).not.toBeNull();
    expect(e.feed(',"changes":[]', 50)).toBeNull();
  });

  it('parses the updatedRecipe partial and flags completeness', () => {
    const e = new TweakEmitter(0);
    const snap = e.feed(FULL_TWEAK, 0);
    expect(snap?.summary).toBe('Lighter and greener.');
    expect(snap?.recipe?.title).toBe('Soup');
    expect(snap?.recipe?.ingredients?.[0]?.added).toBe(true);
    expect(snap?.complete).toBe(true);
  });

  it('reports complete=false while the recipe is still partial', () => {
    const e = new TweakEmitter(0);
    const snap = e.feed('{"summary":"x","changes":[],"updatedRecipe":{"title":"Soup"', 0);
    expect(snap?.recipe?.title).toBe('Soup');
    expect(snap?.complete).toBe(false);
  });

  it('flush emits the latest state bypassing the throttle', () => {
    const e = new TweakEmitter(180);
    e.feed('{"summary":"Lighter"', 0);
    e.feed(',"changes":[]', 10); // throttled, suppressed
    expect(e.flush()?.summary).toBe('Lighter');
  });

  it('returns null when nothing parseable was fed', () => {
    expect(new TweakEmitter().feed('   ', 0)).toBeNull();
    expect(new TweakEmitter().flush()).toBeNull();
  });
});
