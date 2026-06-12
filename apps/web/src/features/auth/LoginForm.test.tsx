import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './components/LoginForm';
import { authStrings } from './strings';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
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

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInEmail.mockResolvedValue({ data: {}, error: null });
    signInSocial.mockResolvedValue({ data: {}, error: null });
  });

  it('renders the board copy: fields, actions, forgot link', () => {
    render(<LoginForm />);
    expect(screen.getByText(s.eyebrow)).toBeTruthy();
    expect(screen.getByLabelText(s.emailLabel)).toBeTruthy();
    expect(screen.getByLabelText(s.passwordLabel)).toBeTruthy();
    expect(screen.getByRole('button', { name: s.submit })).toBeTruthy();
    expect(screen.getByRole('button', { name: s.oauthApple })).toBeTruthy();
    expect(screen.getByRole('button', { name: s.oauthGoogle })).toBeTruthy();
    expect(screen.getByText(s.forgotPassword)).toBeTruthy();
    expect(screen.getByText(s.footerCta)).toBeTruthy();
  });

  it('submits credentials through the auth client', async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(s.emailLabel), 'mara@example.com');
    await userEvent.type(screen.getByLabelText(s.passwordLabel), 'hunter2hunter2');
    await userEvent.click(screen.getByRole('button', { name: s.submit }));
    expect(signInEmail).toHaveBeenCalledWith({
      email: 'mara@example.com',
      password: 'hunter2hunter2',
      rememberMe: true,
    });
  });

  it('shows the invalid-credentials string after a failed sign-in', async () => {
    signInEmail.mockResolvedValue({ data: null, error: { status: 401 } });
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(s.emailLabel), 'mara@example.com');
    await userEvent.type(screen.getByLabelText(s.passwordLabel), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: s.submit }));
    expect(await screen.findByText(s.errors.invalidCredentials)).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('toggles keep-me-signed-in', async () => {
    render(<LoginForm />);
    const checkbox = screen.getByRole('checkbox', { name: s.keepSignedIn });
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    await userEvent.click(checkbox);
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
  });
});
