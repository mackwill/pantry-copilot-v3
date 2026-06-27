import { useRouter } from 'expo-router';
import { useState } from 'react';
import { authClient } from '../../lib/auth-client';
import { authStrings } from './strings';

export type OAuthProvider = 'google' | 'apple';

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const submit = async (): Promise<void> => {
    if (email === '') {
      setError(authStrings.login.errors.emailRequired);
      return;
    }
    if (password === '') {
      setError(authStrings.login.errors.passwordRequired);
      return;
    }
    setError(undefined);
    setPending(true);
    const result = await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error !== null) {
      setError(authStrings.login.errors.invalidCredentials);
      return;
    }
    router.replace('/(tabs)');
  };

  const forgot = async (): Promise<void> => {
    if (email === '') {
      setError(authStrings.login.errors.emailRequired);
      return;
    }
    setError(undefined);
    setNotice(undefined);
    setPending(true);
    const result = await authClient.signIn.magicLink({ email, callbackURL: '/(tabs)' });
    setPending(false);
    if (result.error !== null) {
      setError(authStrings.login.errors.magicFailed);
      return;
    }
    setNotice(authStrings.login.magicSent);
  };

  const oauth = async (provider: OAuthProvider): Promise<void> => {
    const result = await authClient.signIn.social({
      provider,
      callbackURL: '/(tabs)',
    });
    if (result.error !== null) setError(authStrings.login.errors.oauthFailed);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    notice,
    pending,
    submit,
    forgot,
    oauth,
  };
}
