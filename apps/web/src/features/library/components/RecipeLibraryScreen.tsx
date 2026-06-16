import type { RecipeLibraryFilter, RecipeListItem } from '@pantry/contracts';
import { Eyebrow, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { appNavItems, webShellUser } from '../../pantry-shared/nav';
import { libraryStrings as s } from '../strings';
import styles from '../library.module.css';
import { LibraryFilters } from './LibraryFilters';
import { RecipeLibraryEmpty } from './RecipeLibraryEmpty';
import { RecipeListCard } from './RecipeListCard';

const NAV_ROUTES: Record<string, string> = {
  dashboard: '/home',
  pantry: '/pantry',
  cook: '/cook',
  recipes: '/recipes',
};

export interface RecipeLibraryScreenUser {
  name: string;
  email: string;
}

export interface RecipeLibraryScreenProps {
  user: RecipeLibraryScreenUser;
  items: readonly RecipeListItem[];
}

/** Board §03 web library, hosted under the Recipes nav (decision A). */
export function RecipeLibraryScreen({ user, items }: RecipeLibraryScreenProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<RecipeLibraryFilter>('all');

  const visible = useMemo(
    () => (filter === 'favorites' ? items.filter((item) => item.favorited) : items),
    [items, filter],
  );

  const goCookNew = (): void => {
    void navigate({ to: '/cook' });
  };

  return (
    <WebShell
      navItems={appNavItems}
      activeId="recipes"
      user={webShellUser(user)}
      onNavigate={(id) => {
        const to = NAV_ROUTES[id];
        if (to !== undefined) void navigate({ to });
      }}
    >
      <div className={styles['wrap']}>
        {items.length === 0 ? (
          <RecipeLibraryEmpty savedCount={0} recent={[]} onCookNew={goCookNew} />
        ) : (
          <>
            <Eyebrow style={{ marginBottom: 12 }}>{s.eyebrow}</Eyebrow>
            <LibraryFilters active={filter} onChange={setFilter} />
            <div className={styles['list']}>
              {visible.map((item) => (
                <RecipeListCard key={item.id} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </WebShell>
  );
}
