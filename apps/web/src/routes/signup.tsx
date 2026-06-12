import { createFileRoute } from '@tanstack/react-router';
import { SignupScreen } from '../features/auth/components/SignupScreen';

export const Route = createFileRoute('/signup')({
  component: SignupScreen,
});
