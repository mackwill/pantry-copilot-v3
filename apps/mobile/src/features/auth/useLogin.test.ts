import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStrings } from './strings';
import { useLogin } from './useLogin';

const replace = vi.fn();
vi.mock('expo-router', () => ({
  useRouter: () => ({ replace }),
}));

const signInEmail = vi.fn();
const signInSocial = vi.fn();
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmail(...args) as unknown,
      social: (...args: unknown[]) => signInSocial(...args) as unknown,
    },
  },
}));

describe('useLogin (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInEmail.mockResolvedValue({ data: {}, error: null });
    signInSocial.mockResolvedValue({ data: {}, error: null });
  });

  it('requires an email before calling signIn', async () => {
    const { result } = renderHook(() => useLogin());
    await act(() => result.current.submit());
    expect(result.current.error).toBe(authStrings.login.errors.emailRequired);
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it('signs in and replaces to the tabs group', async () => {
    const { result } = renderHook(() => useLogin());
    act(() => {
      result.current.setEmail('mara@example.com');
      result.current.setPassword('hunter2hunter2');
    });
    await act(() => result.current.submit());
    expect(signInEmail).toHaveBeenCalledWith({
      email: 'mara@example.com',
      password: 'hunter2hunter2',
    });
    expect(replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('surfaces invalid credentials on a failed sign-in', async () => {
    signInEmail.mockResolvedValue({ data: null, error: { status: 401 } });
    const { result } = renderHook(() => useLogin());
    act(() => {
      result.current.setEmail('mara@example.com');
      result.current.setPassword('wrong-password');
    });
    await act(() => result.current.submit());
    expect(result.current.error).toBe(authStrings.login.errors.invalidCredentials);
    expect(replace).not.toHaveBeenCalled();
  });

  it('starts the social flow', async () => {
    const { result } = renderHook(() => useLogin());
    await act(() => result.current.oauth('google'));
    expect(signInSocial).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/(tabs)',
    });
  });
});
