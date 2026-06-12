import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginScreen } from '../features/auth/components/LoginScreen';
import { getSession } from '../lib/session';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSession();
    if (session !== null) throw redirect({ to: '/home' });
  },
  component: LoginScreen,
});
