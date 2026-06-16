import { createFileRoute } from '@tanstack/react-router';
import { HomeScreen } from '../../features/generation/components/HomeScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/cook/')({
  // Client-only: the tRPC client carries the session cookie from the browser;
  // the server-side auth guard lives in the _authed layout's beforeLoad.
  ssr: false,
  loader: async () => ({
    user: await api.user.me.query(),
    items: await api.pantry.list.query(),
  }),
  component: CookHomeRoute,
});

function CookHomeRoute() {
  const { user, items } = Route.useLoaderData();
  return <HomeScreen user={user} items={items} />;
}
