import { Eyebrow, WebShell } from '@pantry/design-system/web';
import { homeStrings } from '../strings';

export interface HomeScreenUser {
  name: string;
  email: string;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/** Placeholder authed shell proving the tRPC pipe — the board Home lands in M2. */
export function HomeScreen({ user }: { user: HomeScreenUser }) {
  return (
    <WebShell
      navItems={[{ id: 'home', label: homeStrings.nav.home, icon: 'LayoutDashboard' }]}
      activeId="home"
      user={{ initials: initialsOf(user.name), name: user.name, email: user.email }}
    >
      <Eyebrow>{homeStrings.eyebrow}</Eyebrow>
      <h1>{user.name}</h1>
    </WebShell>
  );
}
