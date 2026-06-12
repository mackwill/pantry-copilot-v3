import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStrings } from './strings';
import { useLogin } from './useLogin';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
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

describe('useLogin', () => {
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

  it('requires a password before calling signIn', async () => {
    const { result } = renderHook(() => useLogin());
    act(() => {
      result.current.setEmail('mara@example.com');
    });
    await act(() => result.current.submit());
    expect(result.current.error).toBe(authStrings.login.errors.passwordRequired);
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it('signs in with valid fields and navigates home', async () => {
    const { result } = renderHook(() => useLogin());
    act(() => {
      result.current.setEmail('mara@example.com');
      result.current.setPassword('hunter2hunter2');
    });
    await act(() => result.current.submit());
    expect(signInEmail).toHaveBeenCalledWith({
      email: 'mara@example.com',
      password: 'hunter2hunter2',
      rememberMe: true,
    });
    expect(navigate).toHaveBeenCalledWith({ to: '/home' });
  });

  it('surfaces invalid credentials when signIn returns an error', async () => {
    signInEmail.mockResolvedValue({ data: null, error: { status: 401 } });
    const { result } = renderHook(() => useLogin());
    act(() => {
      result.current.setEmail('mara@example.com');
      result.current.setPassword('wrong-password');
    });
    await act(() => result.current.submit());
    expect(result.current.error).toBe(authStrings.login.errors.invalidCredentials);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('starts the social flow with a /home callback', async () => {
    const { result } = renderHook(() => useLogin());
    await act(() => result.current.oauth('google'));
    expect(signInSocial).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: `${window.location.origin}/home`,
    });
  });

  it('surfaces the oauth error string when the provider is unavailable', async () => {
    signInSocial.mockResolvedValue({ data: null, error: { status: 400 } });
    const { result } = renderHook(() => useLogin());
    await act(() => result.current.oauth('apple'));
    expect(result.current.error).toBe(authStrings.login.errors.oauthFailed);
  });
});
