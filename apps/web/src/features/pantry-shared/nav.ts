import type { WebShellNavItem, WebShellUser } from '@pantry/design-system/web';

/** Board sidebar nav — shared across the authed app screens (Slices D/E/F reuse this). */
export const appNavItems: WebShellNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'pantry', label: 'Pantry', icon: 'Refrigerator' },
  { id: 'cook', label: 'Cook', icon: 'ChefHat' },
  { id: 'recipes', label: 'Recipes', icon: 'BookOpen' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingCart' },
];

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
