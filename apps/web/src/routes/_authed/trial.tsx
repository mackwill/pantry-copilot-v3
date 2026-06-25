import { createFileRoute } from '@tanstack/react-router';
import { TrialEndingScreen } from '../../features/billing/components/TrialEndingScreen';
import { api } from '../../lib/api';

export const Route = createFileRoute('/_authed/trial')({
  ssr: false,
  loader: () => api.user.me.query(),
  component: TrialRoute,
});

function TrialRoute() {
  const user = Route.useLoaderData();
  const navigate = Route.useNavigate();

  return (
    <TrialEndingScreen
      user={user}
      onBack={() => void navigate({ to: '/home' })}
      onKeepPro={() => void navigate({ to: '/upgrade' })}
      onCancel={() => void navigate({ to: '/home' })}
    />
  );
}
