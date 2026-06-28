import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileEditScreen } from './ProfileEditScreen';

vi.mock('expo-router', () => ({ useRouter: () => ({ back: vi.fn() }) }));

const updateUser = vi.fn<(input: unknown) => Promise<unknown>>().mockResolvedValue({});
vi.mock('../../../lib/auth-client', () => ({
  authClient: { updateUser: (input: unknown): Promise<unknown> => updateUser(input) },
}));

describe('ProfileEditScreen', () => {
  it('saves the edited display name via updateUser', () => {
    render(<ProfileEditScreen name="Mara" email="mara@home.kitchen" />);
    fireEvent.change(screen.getByTestId('profile-name'), { target: { value: 'Mara Quinn' } });
    fireEvent.click(screen.getByTestId('profile-save'));
    expect(updateUser).toHaveBeenCalledWith({ name: 'Mara Quinn' });
  });

  it('shows the email as read-only', () => {
    render(<ProfileEditScreen name="Mara" email="mara@home.kitchen" />);
    expect(screen.getByText('mara@home.kitchen')).toBeTruthy();
  });
});
