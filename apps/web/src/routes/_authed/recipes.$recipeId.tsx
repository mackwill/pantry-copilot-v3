import type { TweakThreadTurn } from '@pantry/utils';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';
import { RecipeChatView } from '../../features/recipe-chat/components/RecipeChatView';
import { RecipeDetailScreen } from '../../features/recipe-detail/components/RecipeDetailScreen';
import { api } from '../../lib/api';

const searchSchema = z.object({
  chat: z.boolean().optional(),
  prompt: z.string().optional(),
});

export const Route = createFileRoute('/_authed/recipes/$recipeId')({
  ssr: false,
  validateSearch: (search) => searchSchema.parse(search),
  loader: async ({ params }) => {
    const [user, recipe, tweaks] = await Promise.all([
      api.user.me.query(),
      api.recipes.byId.query({ recipeId: params.recipeId }).catch(() => {
        throw notFound();
      }),
      api.recipes.tweaks.query({ recipeId: params.recipeId }).catch(() => []),
    ]);
    return { user, recipe, tweaks };
  },
  component: RecipeDetailRoute,
});

function RecipeDetailRoute() {
  const { user, recipe, tweaks } = Route.useLoaderData();
  const { chat, prompt } = Route.useSearch();
  const navigate = Route.useNavigate();

  const openChat = (seed?: string): void => {
    void navigate({ search: seed === undefined ? { chat: true } : { chat: true, prompt: seed } });
  };

  if (chat === true) {
    const turns: TweakThreadTurn[] = tweaks.map((t) => ({
      turn: t.turn,
      userMessage: t.userMessage,
      summary: t.summary,
      changes: t.changes,
    }));
    return (
      <RecipeChatView
        user={user}
        recipe={recipe}
        turns={turns}
        onClose={() => void navigate({ search: { chat: false } })}
        {...(prompt === undefined ? {} : { initialPrompt: prompt })}
      />
    );
  }

  return <RecipeDetailScreen user={user} recipe={recipe} onTweak={openChat} />;
}
