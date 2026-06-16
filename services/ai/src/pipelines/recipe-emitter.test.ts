import { describe, expect, it } from 'vitest';
import { RecipeEmitter } from './recipe-emitter.js';

const FULL = JSON.stringify({
  title: 'Soup',
  summary: 'warm',
  weirdnessScore: 10,
  ingredients: [{ name: 'Water' }],
  steps: ['Boil'],
  timeMinutes: 5,
  difficulty: 'easy',
  whySuggested: 'cozy',
});

describe('RecipeEmitter', () => {
  it('emits a snapshot on the first parseable fragment', () => {
    const e = new RecipeEmitter(180);
    expect(e.feed('{"title":"Soup"', 0)?.recipe.title).toBe('Soup');
  });
  it('throttles emissions within the window', () => {
    const e = new RecipeEmitter(180);
    expect(e.feed('{"title":"Soup"', 0)).not.toBeNull();
    expect(e.feed(',"summary":"warm"', 50)).toBeNull();
  });
  it('emits again once the throttle window passes', () => {
    const e = new RecipeEmitter(180);
    e.feed('{"title":"Soup"', 0);
    expect(e.feed(',"summary":"warm"', 200)?.recipe.summary).toBe('warm');
  });
  it('dedupes identical snapshots', () => {
    const e = new RecipeEmitter(0);
    expect(e.feed('{"title":"Soup"', 0)).not.toBeNull();
    expect(e.feed('   ', 10)).toBeNull();
  });
  it('marks complete only when the snapshot passes full schema', () => {
    const e = new RecipeEmitter(0);
    expect(e.feed('{"title":"Soup"', 0)?.complete).toBe(false);
    expect(e.feed(FULL.slice('{"title":"Soup"'.length), 1)?.complete).toBe(true);
  });
  it('flush emits the latest state bypassing the throttle', () => {
    const e = new RecipeEmitter(180);
    e.feed('{"title":"Soup"', 0);
    e.feed(',"summary":"warm"', 10); // throttled, suppressed
    expect(e.flush()?.recipe.summary).toBe('warm');
  });
  it('flush returns null when nothing parseable was fed', () => {
    expect(new RecipeEmitter().flush()).toBeNull();
  });
});
