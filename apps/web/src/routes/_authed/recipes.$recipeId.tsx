import { createFileRoute, notFound } from '@tanstack/react-router';
import { RecipeDetailScreen } from '../../features/recipe-detail/components/RecipeDetailScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/recipes/$recipeId')({
  ssr: false,
  loader: async ({ params }) => {
    const [user, recipe] = await Promise.all([
      api.user.me.query(),
      api.recipes.byId.query({ recipeId: params.recipeId }).catch(() => {
        throw notFound();
      }),
    ]);
    return { user, recipe };
  },
  component: RecipeDetailRoute,
});

function RecipeDetailRoute() {
  const { user, recipe } = Route.useLoaderData();
  return <RecipeDetailScreen user={user} recipe={recipe} />;
}
