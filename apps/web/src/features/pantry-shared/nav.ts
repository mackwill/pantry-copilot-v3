import type { WebShellNavItem, WebShellUser } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';

/**
 * Board sidebar nav — shared across every authed web screen.
 * Only tabs with a built screen are listed; `Dashboard` is the
 * prompt-first Home (board §01, `active="dashboard"`). `Shopping`
 * (board) is hidden until its screen is built.
 */
export const appNavItems: WebShellNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'pantry', label: 'Pantry', icon: 'Refrigerator' },
  { id: 'cook', label: 'Cook', icon: 'ChefHat' },
  { id: 'recipes', label: 'Recipes', icon: 'BookOpen' },
];

/** Canonical nav-id → route map. The single source of truth for tab routing. */
const NAV_ROUTES: Record<string, string> = {
  dashboard: '/home',
  pantry: '/pantry',
  cook: '/cook',
  recipes: '/recipes',
};

export interface ShellNav {
  navItems: WebShellNavItem[];
  activeId: string | undefined;
  onNavigate: (id: string) => void;
}

/**
 * Wires the routing-agnostic `WebShell` to the router. Spread the
 * result into `<WebShell {...nav} …>` so every screen gets clickable,
 * consistent tabs without re-declaring the route map.
 */
export function useShellNav(activeId?: string): ShellNav {
  const navigate = useNavigate();
  return {
    navItems: appNavItems,
    activeId,
    onNavigate: (id: string) => {
      const to = NAV_ROUTES[id];
      if (to !== undefined) void navigate({ to });
    },
  };
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/** Builds the WebShell sidebar user block from a name/email pair. */
export function webShellUser(user: { name: string; email: string }): WebShellUser {
  return { initials: initialsOf(user.name), name: user.name, email: user.email };
}
