import { createFileRoute } from '@tanstack/react-router';
import { HomeScreen } from '../../features/home/components/HomeScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/home')({
  // Client-only: the tRPC client carries the session cookie from the browser;
  // the server-side auth guard lives in the _authed layout's beforeLoad.
  ssr: false,
  loader: () => api.user.me.query(),
  component: HomeRoute,
});

function HomeRoute() {
  const user = Route.useLoaderData();
  return <HomeScreen user={user} />;
}
