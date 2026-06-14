import { createFileRoute } from '@tanstack/react-router';
import { AccountScreen } from '../../features/account/components/AccountScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/settings')({
  ssr: false,
  loader: () => api.user.me.query(),
  component: SettingsRoute,
});

function SettingsRoute() {
  const user = Route.useLoaderData();
  return <AccountScreen user={user} />;
}
