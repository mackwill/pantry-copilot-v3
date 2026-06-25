import { createFileRoute } from '@tanstack/react-router';
import { AccountScreen } from '../../features/account/components/AccountScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/settings')({
  ssr: false,
  loader: () => Promise.all([api.user.me.query(), api.subscription.get.query()]),
  component: SettingsRoute,
});

function SettingsRoute() {
  const [user, subscription] = Route.useLoaderData();
  return <AccountScreen user={user} subscription={subscription} />;
}
