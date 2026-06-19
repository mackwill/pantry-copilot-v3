import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appNavItems, useShellNav } from './nav';

const navigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));

describe('appNavItems', () => {
  it('lists only the tabs with built screens (Shopping hidden until built)', () => {
    expect(appNavItems.map((item) => item.id)).toEqual(['dashboard', 'pantry', 'cook', 'recipes']);
  });
});

describe('useShellNav', () => {
  it('navigates to the mapped route for a known nav id', () => {
    navigate.mockClear();
    const { result } = renderHook(() => useShellNav('pantry'));
    result.current.onNavigate('recipes');
    expect(navigate).toHaveBeenCalledWith({ to: '/recipes' });
  });

  it('maps the Dashboard tab to the home route', () => {
    navigate.mockClear();
    const { result } = renderHook(() => useShellNav('dashboard'));
    result.current.onNavigate('dashboard');
    expect(navigate).toHaveBeenCalledWith({ to: '/home' });
  });

  it('no-ops for an unknown nav id', () => {
    navigate.mockClear();
    const { result } = renderHook(() => useShellNav('pantry'));
    result.current.onNavigate('shopping');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('exposes the active id and the full nav item list', () => {
    const { result } = renderHook(() => useShellNav('cook'));
    expect(result.current.activeId).toBe('cook');
    expect(result.current.navItems).toBe(appNavItems);
  });
});
