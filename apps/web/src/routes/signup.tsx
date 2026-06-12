import { createFileRoute, redirect } from '@tanstack/react-router';
import { SignupScreen } from '../features/auth/components/SignupScreen';
import { getSession } from '../lib/session';

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const session = await getSession();
    if (session !== null) throw redirect({ to: '/home' });
  },
  component: SignupScreen,
});
