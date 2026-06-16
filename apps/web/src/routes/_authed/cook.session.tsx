import { createFileRoute, redirect } from '@tanstack/react-router';
import { CookSessionScreen } from '../../features/cook/components/CookSessionScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/cook/session')({
  ssr: false,
  loader: async () => {
    const session = await api.cook.getActive.query();
    if (session === null) throw redirect({ to: '/recipes' });
    const [user, recipe] = await Promise.all([
      api.user.me.query(),
      api.recipes.byId.query({ recipeId: session.recipeId }),
    ]);
    return { user, session, recipe };
  },
  component: CookSessionRoute,
});

function CookSessionRoute() {
  const { user, session, recipe } = Route.useLoaderData();
  return <CookSessionScreen user={user} session={session} recipe={recipe} />;
}
