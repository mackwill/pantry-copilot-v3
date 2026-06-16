import { createFileRoute } from '@tanstack/react-router';
import { RecipeLibraryScreen } from '../../features/library/components/RecipeLibraryScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/recipes/')({
  // Client-only: the tRPC client carries the session cookie from the browser;
  // the server-side auth guard lives in the _authed layout's beforeLoad.
  ssr: false,
  loader: async () => ({
    user: await api.user.me.query(),
    items: await api.recipes.list.query({}),
  }),
  component: RecipeLibraryRoute,
});

function RecipeLibraryRoute() {
  const { user, items } = Route.useLoaderData();
  return <RecipeLibraryScreen user={user} items={items} />;
}
