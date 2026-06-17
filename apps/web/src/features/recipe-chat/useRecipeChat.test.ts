import type { AIRecipe, RecipeDetail, RecipeTweakEvent } from '@pantry/contracts';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRecipeChat, type TweakHandlers } from './useRecipeChat';

vi.mock('../../lib/api', () => ({ api: {} }));

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

const doneEvent: RecipeTweakEvent = {
  type: 'tweak_done',
  response: { summary: 'Lighter and greener.', changes: [{ tag: 'add', text: 'Added spinach' }], updatedRecipe: UPDATED },
  recipeId: 'r1',
  turn: 1,
  version: 2,
  seq: 5,
  t: 50,
};

function setup() {
  let captured: TweakHandlers | null = null;
  const unsubscribe = vi.fn();
  const subscribe = vi.fn((_input, handlers: TweakHandlers) => {
    captured = handlers;
    return { unsubscribe };
  });
  const hook = renderHook(() =>
    useRecipeChat({ recipe: RECIPE, recipeId: 'r1', version: 1, turns: [] }, { subscribe }),
  );
  return { hook, subscribe, unsubscribe, handlers: () => captured };
}

describe('useRecipeChat', () => {
  it('seeds from the loaded recipe', () => {
    const { hook } = setup();
    expect(hook.result.current.recipe?.title).toBe('Fried Rice');
    expect(hook.result.current.version).toBe(1);
    expect(hook.result.current.isStreaming).toBe(false);
  });

  it('streams a turn: optimistic bubble → summary → live recipe → applied turn', () => {
    const { hook, subscribe, handlers } = setup();

    act(() => {
      hook.result.current.send('more greens');
    });
    expect(subscribe).toHaveBeenCalledWith({ recipeId: 'r1', prompt: 'more greens' }, expect.anything());
    expect(hook.result.current.pendingUserMessage).toBe('more greens');
    expect(hook.result.current.isStreaming).toBe(true);

    act(() => {
      handlers()?.onData({ type: 'tweak_summary', text: 'Lighter.', seq: 0, t: 0 });
    });
    expect(hook.result.current.streamingSummary).toBe('Lighter.');

    act(() => {
      handlers()?.onData({ type: 'tweak_recipe_partial', recipe: { title: 'Greener Fried Rice' }, complete: false, seq: 1, t: 1 });
    });
    expect(hook.result.current.recipe?.title).toBe('Greener Fried Rice');

    act(() => {
      handlers()?.onData(doneEvent);
    });
    expect(hook.result.current.status).toBe('done');
    expect(hook.result.current.version).toBe(2);
    expect(hook.result.current.turns).toHaveLength(1);
    expect(hook.result.current.turns[0]?.userMessage).toBe('more greens');
    expect(hook.result.current.pendingUserMessage).toBeNull();
  });

  it('ignores an empty prompt', () => {
    const { hook, subscribe } = setup();
    act(() => {
      hook.result.current.send('   ');
    });
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('revert restores the snapshot and clears the thread', async () => {
    const reverted: RecipeDetail = {
      ...RECIPE,
      id: 'r1',
      userId: 'u1',
      prompt: 'rice',
      weirdness: 40,
      createdAt: '2026-06-16T00:00:00.000Z',
      favorited: false,
      version: 1,
      tweakCount: 0,
    };
    const revertImpl = vi.fn().mockResolvedValue(reverted);
    const subscribe = vi.fn(() => ({ unsubscribe: vi.fn() }));
    const hook = renderHook(() =>
      useRecipeChat({ recipe: UPDATED, recipeId: 'r1', version: 2, turns: [{ turn: 1, userMessage: 'x', summary: 'y', changes: [] }] }, { subscribe, revert: revertImpl }),
    );

    await act(async () => {
      hook.result.current.revert();
      await Promise.resolve();
    });
    expect(revertImpl).toHaveBeenCalledWith('r1');
    expect(hook.result.current.version).toBe(1);
    expect(hook.result.current.turns).toHaveLength(0);
    expect(hook.result.current.recipe?.title).toBe('Fried Rice');
  });
});
