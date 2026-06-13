import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './components/LoginForm';
import { authStrings } from './strings';

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

const s = authStrings.login;

describe('LoginForm (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInEmail.mockResolvedValue({ data: {}, error: null });
    signInSocial.mockResolvedValue({ data: {}, error: null });
  });

  it('renders the strings-driven controls and forgot link', () => {
    render(<LoginForm />);
    expect(screen.getByText(s.eyebrow)).toBeTruthy();
    expect(screen.getByTestId('login-email')).toBeTruthy();
    expect(screen.getByTestId('login-password')).toBeTruthy();
    expect(screen.getByText(s.submit)).toBeTruthy();
    expect(screen.getByText(s.oauthApple)).toBeTruthy();
    expect(screen.getByText(s.oauthGoogle)).toBeTruthy();
    expect(screen.getByText(s.forgotPassword)).toBeTruthy();
    expect(screen.getByText(s.footerCta)).toBeTruthy();
  });

  it('submits credentials through the auth client', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByTestId('login-email'), 'mara@example.com');
    await userEvent.type(screen.getByTestId('login-password'), 'hunter2hunter2');
    await userEvent.click(screen.getByText(s.submit));
    expect(signInEmail).toHaveBeenCalledWith({
      email: 'mara@example.com',
      password: 'hunter2hunter2',
    });
  });

  it('shows the invalid-credentials string after a failed sign-in', async () => {
    signInEmail.mockResolvedValue({ data: null, error: { status: 401 } });
    render(<LoginForm />);
    await userEvent.type(screen.getByTestId('login-email'), 'mara@example.com');
    await userEvent.type(screen.getByTestId('login-password'), 'wrong-password');
    await userEvent.click(screen.getByText(s.submit));
    expect(await screen.findByText(s.errors.invalidCredentials)).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
