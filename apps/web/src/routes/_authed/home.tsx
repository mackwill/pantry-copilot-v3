import { createFileRoute } from '@tanstack/react-router';
import { HomeScreen } from '../../features/generation/components/HomeScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/home')({
  // Client-only: the tRPC client carries the session cookie from the browser;
  // the server-side auth guard lives in the _authed layout's beforeLoad.
  ssr: false,
  loader: async () => ({
    user: await api.user.me.query(),
    items: await api.pantry.list.query(),
  }),
  component: HomeRoute,
});

// Board §01 Home is the prompt-first hero under the `dashboard` tab
// (board `WebShell active="dashboard"`), and it's the post-login landing.
function HomeRoute() {
  const { user, items } = Route.useLoaderData();
  return <HomeScreen user={user} items={items} activeNav="dashboard" />;
}
