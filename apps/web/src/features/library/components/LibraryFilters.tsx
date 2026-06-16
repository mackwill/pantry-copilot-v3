import type { RecipeLibraryFilter } from '@pantry/contracts';
import { LIBRARY_FILTER_TABS, libraryStrings as s } from '../strings';
import styles from '../library.module.css';

export interface LibraryFiltersProps {
  active: RecipeLibraryFilter;
  onChange: (filter: RecipeLibraryFilter) => void;
}

/** Board §03 filter pills. All/Favorites/Recent are data-backed; the rest wait on M6. */
export function LibraryFilters({ active, onChange }: LibraryFiltersProps) {
  return (
    <div className={styles['filters']}>
      {LIBRARY_FILTER_TABS.map((tab) => {
        const enabled = tab.filter !== undefined;
        const isActive = enabled && tab.filter === active;
        const className = [
          styles['filterPill'],
          isActive ? styles['filterPillActive'] : null,
          enabled ? null : styles['filterPillDisabled'],
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={tab.id}
            type="button"
            className={className}
            disabled={!enabled}
            title={enabled ? undefined : s.filterDisabledHint}
            onClick={() => {
              if (tab.filter !== undefined) onChange(tab.filter);
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
