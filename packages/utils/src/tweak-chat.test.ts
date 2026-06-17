import type { AIRecipe, RecipeTweakEvent } from '@pantry/contracts';
import { describe, expect, it } from 'vitest';
import {
  beginTweakTurn,
  changeChipTone,
  initialTweakState,
  reduceTweakEvent,
  type TweakChatState,
} from './tweak-chat';

const RECIPE: AIRecipe = {
  title: 'Fried Rice',
  summary: 'Fast skillet rice.',
  weirdnessScore: 40,
  ingredients: [{ name: 'Rice', quantity: 2, unit: 'cup', optional: false, note: null }],
  steps: [{ text: 'Crisp the rice.' }],
  timeMinutes: 20,
  difficulty: 'easy',
  substitutions: [],
  pantryItemsUsed: [],
  confidence: 0.8,
  caveats: [],
  whySuggested: 'why',
  observation: null,
};

const UPDATED: AIRecipe = { ...RECIPE, title: 'Greener Fried Rice' };

function base(): TweakChatState {
  return initialTweakState({ recipe: RECIPE, recipeId: 'r1', version: 1, turns: [] });
}

const done: RecipeTweakEvent = {
  type: 'tweak_done',
  response: { summary: 'Lighter and greener.', changes: [{ tag: 'add', text: 'Added spinach' }], updatedRecipe: UPDATED },
  recipeId: 'r1',
  turn: 1,
  version: 2,
  seq: 9,
  t: 90,
};

describe('initialTweakState', () => {
  it('seeds an idle state from the loaded recipe + thread', () => {
    const s = initialTweakState({ recipe: RECIPE, recipeId: 'r1', version: 3, turns: [] });
    expect(s.status).toBe('idle');
    expect(s.recipe?.title).toBe('Fried Rice');
    expect(s.version).toBe(3);
    expect(s.streamingSummary).toBe('');
  });
});

describe('beginTweakTurn', () => {
  it('opens an optimistic turn and clears prior stream state', () => {
    const s = beginTweakTurn({ ...base(), error: { code: 'x', message: 'y' }, streamingSummary: 'old' }, 'more greens');
    expect(s.status).toBe('streaming');
    expect(s.pendingUserMessage).toBe('more greens');
    expect(s.streamingSummary).toBe('');
    expect(s.error).toBeNull();
  });
});

describe('reduceTweakEvent', () => {
  it('accumulates the streaming summary', () => {
    let s = beginTweakTurn(base(), 'more greens');
    s = reduceTweakEvent(s, { type: 'tweak_summary', text: 'Lighter ', seq: 0, t: 0 });
    s = reduceTweakEvent(s, { type: 'tweak_summary', text: 'and greener.', seq: 1, t: 1 });
    expect(s.streamingSummary).toBe('Lighter and greener.');
    expect(s.status).toBe('streaming');
  });

  it('updates the live recipe from a partial', () => {
    const s = reduceTweakEvent(base(), { type: 'tweak_recipe_partial', recipe: { title: 'Half-done' }, complete: false, seq: 0, t: 0 });
    expect(s.recipe?.title).toBe('Half-done');
  });

  it('applies tweak_done: pushes the turn, swaps the recipe, bumps version, clears stream state', () => {
    let s = beginTweakTurn(base(), 'more greens');
    s = reduceTweakEvent(s, { type: 'tweak_summary', text: 'Lighter.', seq: 0, t: 0 });
    s = reduceTweakEvent(s, done);
    expect(s.status).toBe('done');
    expect(s.recipe?.title).toBe('Greener Fried Rice');
    expect(s.version).toBe(2);
    expect(s.turns).toHaveLength(1);
    expect(s.turns[0]).toEqual({
      turn: 1,
      userMessage: 'more greens',
      summary: 'Lighter and greener.',
      changes: [{ tag: 'add', text: 'Added spinach' }],
    });
    expect(s.pendingUserMessage).toBeNull();
    expect(s.streamingSummary).toBe('');
  });

  it('records an error and clears the in-flight summary', () => {
    let s = beginTweakTurn(base(), 'oops');
    s = reduceTweakEvent(s, { type: 'tweak_summary', text: 'partial', seq: 0, t: 0 });
    s = reduceTweakEvent(s, { type: 'error', code: 'timeout', message: 'slow', seq: 1, t: 1 });
    expect(s.status).toBe('error');
    expect(s.error).toEqual({ code: 'timeout', message: 'slow' });
    expect(s.streamingSummary).toBe('');
  });

  it('marks aborted and drops the pending turn', () => {
    const s = reduceTweakEvent(beginTweakTurn(base(), 'stop'), { type: 'aborted', seq: 0, t: 0 });
    expect(s.status).toBe('aborted');
    expect(s.pendingUserMessage).toBeNull();
  });
});

describe('changeChipTone', () => {
  it('maps each tag to the board tone', () => {
    expect(changeChipTone('change')).toBe('warning');
    expect(changeChipTone('add')).toBe('accent');
    expect(changeChipTone('remove')).toBe('danger');
    expect(changeChipTone('note')).toBe('neutral');
  });
});
