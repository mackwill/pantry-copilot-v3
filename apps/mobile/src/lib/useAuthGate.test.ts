import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthGate } from './useAuthGate';

const replace = vi.fn();
let segments: string[] = [];
vi.mock('expo-router', () => ({
  useRouter: () => ({ replace }),
  useSegments: () => segments,
}));

let sessionState: { data: unknown; isPending: boolean } = { data: null, isPending: false };
vi.mock('./auth-client', () => ({
  authClient: {
    useSession: () => sessionState,
  },
}));

describe('useAuthGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when there is no session outside (auth)', () => {
    sessionState = { data: null, isPending: false };
    segments = ['(tabs)'];
    renderHook(() => {
      useAuthGate();
    });
    expect(replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('redirects to tabs when a session exists inside (auth)', () => {
    sessionState = { data: { user: { id: 'u1' } }, isPending: false };
    segments = ['(auth)', 'login'];
    renderHook(() => {
      useAuthGate();
    });
    expect(replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('does nothing while the session is pending', () => {
    sessionState = { data: null, isPending: true };
    segments = ['(tabs)'];
    renderHook(() => {
      useAuthGate();
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it('does nothing when already in the right group', () => {
    sessionState = { data: null, isPending: false };
    segments = ['(auth)', 'login'];
    renderHook(() => {
      useAuthGate();
    });
    expect(replace).not.toHaveBeenCalled();
  });
});
