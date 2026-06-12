import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { authStrings } from './strings';

const s = authStrings.signup;

export function useSignup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const submit = async (): Promise<void> => {
    if (name === '') {
      setError(s.errors.nameRequired);
      return;
    }
    if (email === '') {
      setError(s.errors.emailRequired);
      return;
    }
    if (password === '') {
      setError(s.errors.passwordRequired);
      return;
    }
    setError(undefined);
    setPending(true);
    const result = await authClient.signUp.email({ name, email, password });
    setPending(false);
    if (result.error !== null) {
      setError(result.error.status === 422 ? s.errors.emailTaken : s.errors.generic);
      return;
    }
    await navigate({ to: '/home' });
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    pending,
    submit,
  };
}
