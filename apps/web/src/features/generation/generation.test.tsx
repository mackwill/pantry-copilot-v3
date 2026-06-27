import type { GenerationEvent } from '@pantry/contracts';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GenerateScreen } from './components/GenerateScreen';
import type { GenerationSubscribe } from './useGeneration';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, params }: { children: unknown; params?: { recipeId?: string } }) => {
    const href = params?.recipeId !== undefined ? `/recipes/${params.recipeId}` : '#';
    return <a href={href}>{children as never}</a>;
  },
}));

const cookStart = vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue({});
vi.mock('../../lib/api', () => ({
  api: {
    cook: { start: { mutate: (input: unknown): Promise<unknown> => cookStart(input) } },
    recipes: { setFavorite: { mutate: (): Promise<unknown> => Promise.resolve({ favorited: true }) } },
  },
}));

const user = { name: 'Mara Quinn', email: 'mara@example.com' };

const fullRecipe = {
  title: 'Charred Scallion & Carrot Fried Rice',
  summary: 'A fast, savory skillet of day-old rice.',
  weirdnessScore: 40,
  ingredients: [
    { name: 'Cooked rice', quantity: 3, unit: 'cup', optional: false, note: 'day-old' },
    { name: 'Scallions', quantity: 1, unit: 'bunch', optional: false, note: null },
  ],
  steps: [{ text: 'Melt the butter.' }, { text: 'Add the rice and toss.' }],
  timeMinutes: 20,
  difficulty: 'easy' as const,
  substitutions: [],
  pantryItemsUsed: ['Scallions'],
  confidence: 0.86,
  caveats: [],
  whySuggested: 'Uses your scallions.',
  observation: 'Scallions are on their way out.',
};

const tape: GenerationEvent[] = [
  { type: 'pulling_from', must: ['Scallions'], maybe: ['Carrots'], seq: 0, t: 0 },
  { type: 'thinking_token', text: 'Anchoring on the expiring scallions.', seq: 1, t: 10 },
  { type: 'tool_event', id: 'r', name: 'read_pantry', state: 'complete', display: 'read_pantry()', result: '14 items', seq: 2, t: 20 },
  { type: 'recipe_partial', recipe: { title: 'Charred Scallion & Carrot Fried Rice' }, complete: false, seq: 3, t: 3400 },
  { type: 'notice', text: 'Scallions are on their way out.', seq: 4, t: 3500 },
  { type: 'done', recipe: fullRecipe, recipeId: 'a151a2bf-3bb5-45e9-9d11-11b3be8b7c3b', seq: 5, t: 3600 },
];

/** Fake subscription capturing handlers so the test drives the tape frame-by-frame. */
function makeFake() {
  let onData: (e: GenerationEvent) => void = () => {};
  let onError: (err: unknown) => void = () => {};
  const subscribe: GenerationSubscribe = (_input, handlers) => {
    onData = handlers.onData;
    onError = handlers.onError;
    return { unsubscribe: vi.fn() };
  };
  return {
    subscribe,
    emit: (e: GenerationEvent) => { act(() => { onData(e); }); },
    fail: (err: unknown) => { act(() => { onError(err); }); },
  };
}

describe('generation flow (Thinking → Drafting → Result)', () => {
  it('streams from thinking through drafting to the committed recipe + branch tiles', () => {
    const fake = makeFake();
    render(<GenerateScreen prompt="cozy carrots" weirdness={40} user={user} subscribe={fake.subscribe} />);

    // The ask is always shown.
    expect(screen.getByText(/cozy carrots/)).toBeTruthy();

    // Thinking beat.
    fake.emit(tape[0] as GenerationEvent);
    fake.emit(tape[1] as GenerationEvent);
    fake.emit(tape[2] as GenerationEvent);
    expect(screen.getByText('Thinking')).toBeTruthy();
    expect(screen.getByText(/Anchoring on the expiring scallions/)).toBeTruthy();
    expect(screen.getByText(/read_pantry/)).toBeTruthy();

    // Drafting beat — single streaming recipe (no "Recipe 1 of 3" / queued cards).
    fake.emit(tape[3] as GenerationEvent);
    expect(screen.getByText('drafting')).toBeTruthy();
    expect(screen.queryByText(/of 3/)).toBeNull();

    // Result.
    fake.emit(tape[4] as GenerationEvent);
    fake.emit(tape[5] as GenerationEvent);
    expect(screen.getByRole('heading', { name: fullRecipe.title })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Start cooking/ })).toBeTruthy();
    expect(screen.getByText('Weirder')).toBeTruthy();
    expect(screen.getByText('Different angle')).toBeTruthy();
  });

  it('starts a cook session and navigates when "Start cooking" is clicked', async () => {
    const fake = makeFake();
    render(<GenerateScreen prompt="cozy carrots" weirdness={40} user={user} subscribe={fake.subscribe} />);
    for (const event of tape) fake.emit(event);

    await userEvent.click(screen.getByRole('button', { name: /Start cooking/ }));
    expect(cookStart).toHaveBeenCalledWith({ recipeId: 'a151a2bf-3bb5-45e9-9d11-11b3be8b7c3b' });
    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: '/cook/session' });
    });
  });

  it('reveals the reasoning transcript when "show reasoning" is toggled', async () => {
    const fake = makeFake();
    render(<GenerateScreen prompt="cozy carrots" weirdness={40} user={user} subscribe={fake.subscribe} />);
    for (const event of tape) fake.emit(event);

    expect(screen.queryByText(/Anchoring on the expiring scallions/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /show reasoning/ }));
    expect(screen.getByText(/Anchoring on the expiring scallions/)).toBeTruthy();
  });

  it('opens the limit-hit paywall modal when generation hits the weekly limit', () => {
    const fake = makeFake();
    render(<GenerateScreen prompt="cozy carrots" weirdness={40} user={user} subscribe={fake.subscribe} />);

    expect(screen.queryByRole('dialog')).toBeNull();
    fake.fail({ message: 'limit_reached' });
    expect(screen.getByRole('dialog', { name: /weekly limit reached/i })).toBeTruthy();
  });
});
