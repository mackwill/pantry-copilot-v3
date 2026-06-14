import { createFileRoute } from '@tanstack/react-router';
import { InventoryScreen } from '../../features/inventory/components/InventoryScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/pantry')({
  // Client-only: the tRPC client carries the session cookie from the browser;
  // the server-side auth guard lives in the _authed layout's beforeLoad.
  ssr: false,
  loader: async () => ({
    items: await api.pantry.list.query(),
    user: await api.user.me.query(),
  }),
  component: PantryRoute,
});

function PantryRoute() {
  const { items, user } = Route.useLoaderData();
  return <InventoryScreen items={items} user={user} />;
}
