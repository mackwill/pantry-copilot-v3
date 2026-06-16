import type { CookSession, RecipeDetail } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cookStrings } from '../strings';
import { CookSessionScreen } from './CookSessionScreen';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

const advanceStep = vi.fn();
const abandon = vi.fn();
const consume = vi.fn();
vi.mock('../../../lib/api', () => ({
  api: {
    cook: {
      advanceStep: { mutate: (input: unknown): Promise<unknown> => advanceStep(input) as Promise<unknown> },
      abandon: { mutate: (input: unknown): Promise<unknown> => abandon(input) as Promise<unknown> },
      consume: { mutate: (input: unknown): Promise<unknown> => consume(input) as Promise<unknown> },
    },
  },
}));

const user = { name: 'Mara Quinn', email: 'mara@example.com' };

function makeRecipe(): RecipeDetail {
  return {
    id: 'r1',
    userId: 'u1',
    prompt: 'rice',
    weirdness: 40,
    createdAt: '2026-06-16T00:00:00.000Z',
    favorited: false,
    title: 'Charred Scallion Rice',
    summary: 'Fast skillet rice.',
    weirdnessScore: 40,
    ingredients: [{ name: 'Rice', quantity: 2, unit: 'cup', optional: false, note: null }],
    steps: [
      { text: 'Melt the butter.', label: 'melt', durationMinutes: 2 },
      { text: 'Add the rice and toss.', label: 'toss' },
      { text: 'Finish with soy.', label: 'finish' },
    ],
    timeMinutes: 15,
    difficulty: 'easy',
    substitutions: [],
    pantryItemsUsed: ['rice'],
    confidence: 0.8,
    caveats: ['Do not let it stick.'],
    whySuggested: 'Uses pantry staples.',
    observation: null,
  };
}

function makeSession(): CookSession {
  return {
    id: 's1',
    recipeId: 'r1',
    status: 'active',
    currentStepIndex: 0,
    totalSteps: 3,
    recipeTitle: 'Charred Scallion Rice',
    startedAt: '2026-06-16T18:48:00.000Z',
  };
}

describe('CookSessionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    advanceStep.mockResolvedValue(undefined);
    consume.mockResolvedValue({ sessionId: 's1', itemsConsumed: 0, itemsRemoved: 0 });
  });

  it('renders the current step, the seeded timer, and the up-next step', () => {
    render(<CookSessionScreen user={user} session={makeSession()} recipe={makeRecipe()} />);
    expect(screen.getByText('Melt the butter.')).toBeTruthy();
    expect(screen.getByText(cookStrings.cookingNow)).toBeTruthy();
    // First step is timed at 2 minutes → 2:00 seeded on the ring.
    expect(screen.getByText('2:00')).toBeTruthy();
    // Up-next surfaces the following step.
    expect(screen.getByText('Add the rice and toss.')).toBeTruthy();
  });

  it('advances to the next step and persists the move', async () => {
    render(<CookSessionScreen user={user} session={makeSession()} recipe={makeRecipe()} />);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(cookStrings.next) }));
    expect(advanceStep).toHaveBeenCalledWith({ sessionId: 's1', stepIndex: 1 });
    // The heading follows to the second step.
    expect(screen.getAllByText('Add the rice and toss.').length).toBeGreaterThan(0);
  });

  it('finishes on the last step by completing the session', async () => {
    render(<CookSessionScreen user={user} session={{ ...makeSession(), currentStepIndex: 2 }} recipe={makeRecipe()} />);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(cookStrings.finish) }));
    expect(consume).toHaveBeenCalledWith({ sessionId: 's1', items: [] });
  });
});
