import type { GenerationEvent } from '@pantry/contracts';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { GenerationSubscribe } from '../useGeneration';
import { GenerateScreen } from './GenerateScreen';

const push = vi.fn();
vi.mock('expo-router', () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

const cookStart = vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue({});
const setFavorite = vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue({ favorited: true });
vi.mock('../../../lib/api', () => ({
  api: {
    cook: { start: { mutate: (input: unknown): Promise<unknown> => cookStart(input) } },
    recipes: { setFavorite: { mutate: (input: unknown): Promise<unknown> => setFavorite(input) } },
  },
}));

const fullRecipe = {
  title: 'Charred Scallion Fried Rice',
  summary: 'Fast skillet of day-old rice.',
  weirdnessScore: 40,
  ingredients: [{ name: 'Cooked rice', quantity: 3, unit: 'cup', optional: false, note: null }],
  steps: [{ text: 'Toss the rice.' }],
  timeMinutes: 20,
  difficulty: 'easy' as const,
  substitutions: [],
  pantryItemsUsed: [],
  confidence: 0.86,
  caveats: [],
  whySuggested: 'Uses rice.',
  observation: null,
};

const RECIPE_ID = 'a151a2bf-3bb5-45e9-9d11-11b3be8b7c3b';
const tape: GenerationEvent[] = [
  { type: 'recipe_partial', recipe: { title: fullRecipe.title }, complete: false, seq: 0, t: 100 },
  { type: 'done', recipe: fullRecipe, recipeId: RECIPE_ID, seq: 1, t: 200 },
];

function makeFake() {
  let onData: (e: GenerationEvent) => void = () => {};
  const subscribe: GenerationSubscribe = (_input, handlers) => {
    onData = handlers.onData;
    return { unsubscribe: vi.fn() };
  };
  return { subscribe, emit: (e: GenerationEvent) => { act(() => { onData(e); }); } };
}

describe('GenerateScreen (mobile) result actions', () => {
  it('starts a cook session and navigates when "Start cooking" is pressed', async () => {
    const fake = makeFake();
    render(<GenerateScreen prompt="rice" weirdness={40} pantryItemIds={[]} onClose={vi.fn()} subscribe={fake.subscribe} />);
    for (const event of tape) fake.emit(event);

    fireEvent.click(screen.getByText('Start cooking'));
    expect(cookStart).toHaveBeenCalledWith({ recipeId: RECIPE_ID });
    await vi.waitFor(() => {
      expect(push).toHaveBeenCalledWith('/session');
    });
  });

  it('persists a favorite when "Save" is pressed', () => {
    const fake = makeFake();
    render(<GenerateScreen prompt="rice" weirdness={40} pantryItemIds={[]} onClose={vi.fn()} subscribe={fake.subscribe} />);
    for (const event of tape) fake.emit(event);

    fireEvent.click(screen.getByText('Save'));
    expect(setFavorite).toHaveBeenCalledWith({ recipeId: RECIPE_ID, favorited: true });
  });
});
