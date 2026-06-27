import { createFileRoute } from '@tanstack/react-router';
import { DietPreferencesScreen } from '../../features/account/components/DietPreferencesScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/settings/diet')({
  ssr: false,
  loader: () => Promise.all([api.user.me.query(), api.user.preferences.query()]),
  component: DietRoute,
});

function DietRoute() {
  const [user, preferences] = Route.useLoaderData();
  return <DietPreferencesScreen user={user} preferences={preferences} />;
}
