import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const magicLink = vi.fn<(input: unknown) => Promise<{ error: unknown }>>();
vi.mock('../../../lib/auth-client', () => ({
  authClient: { signIn: { magicLink: (input: unknown): Promise<{ error: unknown }> => magicLink(input) } },
}));

beforeEach(() => {
  magicLink.mockReset().mockResolvedValue({ error: null });
});

describe('LoginForm — forgot password (magic link)', () => {
  it('sends a magic link to the entered email and confirms', async () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'mara@home.kitchen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password' }));

    expect(await screen.findByText(/sent you a sign-in link/i)).toBeTruthy();
    expect(magicLink).toHaveBeenCalledWith(expect.objectContaining({ email: 'mara@home.kitchen' }));
  });

  it('does not send a link when the email is empty', () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password' }));
    expect(magicLink).not.toHaveBeenCalled();
  });
});
