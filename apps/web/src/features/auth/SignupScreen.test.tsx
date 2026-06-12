import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupScreen } from './components/SignupScreen';
import { authStrings } from './strings';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

const signUpEmail = vi.fn();
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => signUpEmail(...args) as unknown,
    },
  },
}));

const s = authStrings.signup;

describe('SignupScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signUpEmail.mockResolvedValue({ data: {}, error: null });
  });

  it('renders name/email/password and the create-account action from strings', () => {
    render(<SignupScreen />);
    expect(screen.getByText(s.eyebrow)).toBeTruthy();
    expect(screen.getByLabelText(s.nameLabel)).toBeTruthy();
    expect(screen.getByLabelText(s.emailLabel)).toBeTruthy();
    expect(screen.getByLabelText(s.passwordLabel)).toBeTruthy();
    expect(screen.getByRole('button', { name: s.submit })).toBeTruthy();
  });

  it('signs up and navigates home', async () => {
    render(<SignupScreen />);
    await userEvent.type(screen.getByLabelText(s.nameLabel), 'Mara Voss');
    await userEvent.type(screen.getByLabelText(s.emailLabel), 'mara@example.com');
    await userEvent.type(screen.getByLabelText(s.passwordLabel), 'hunter2hunter2');
    await userEvent.click(screen.getByRole('button', { name: s.submit }));
    expect(signUpEmail).toHaveBeenCalledWith({
      name: 'Mara Voss',
      email: 'mara@example.com',
      password: 'hunter2hunter2',
    });
    expect(navigate).toHaveBeenCalledWith({ to: '/home' });
  });

  it('surfaces the email-taken string on a 422', async () => {
    signUpEmail.mockResolvedValue({ data: null, error: { status: 422 } });
    render(<SignupScreen />);
    await userEvent.type(screen.getByLabelText(s.nameLabel), 'Mara Voss');
    await userEvent.type(screen.getByLabelText(s.emailLabel), 'mara@example.com');
    await userEvent.type(screen.getByLabelText(s.passwordLabel), 'hunter2hunter2');
    await userEvent.click(screen.getByRole('button', { name: s.submit }));
    expect(await screen.findByText(s.errors.emailTaken)).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('requires a name before calling signUp', async () => {
    render(<SignupScreen />);
    await userEvent.click(screen.getByRole('button', { name: s.submit }));
    expect(await screen.findByText(s.errors.nameRequired)).toBeTruthy();
    expect(signUpEmail).not.toHaveBeenCalled();
  });

  it('links back to sign-in', () => {
    render(<SignupScreen />);
    const link = screen.getByText(s.footerCta).closest('a');
    expect(link?.getAttribute('href')).toBe('/login');
  });
});
