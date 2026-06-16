import type { RecipeListItem } from '@pantry/contracts';
import { Icon, Pill } from '@pantry/design-system/web';
import { Link } from '@tanstack/react-router';
import { libraryStrings as s } from '../strings';
import styles from '../library.module.css';

export interface RecipeListCardProps {
  item: RecipeListItem;
}

/** A library row — whole card links to the recipe detail page. */
export function RecipeListCard({ item }: RecipeListCardProps) {
  const adventurous = item.weirdness >= 70;
  const titleClass = [styles['rowTitle'], adventurous ? styles['rowTitleItalic'] : null].filter(Boolean).join(' ');
  return (
    <Link to="/recipes/$recipeId" params={{ recipeId: item.id }} className={styles['row']}>
      <div className={styles['rowMain']}>
        <div className={titleClass}>{item.title}</div>
        {item.summary !== null && item.summary.length > 0 && <div className={styles['rowSummary']}>{item.summary}</div>}
        <div className={styles['rowMeta']}>
          {s.cardTimePill(item.timeMinutes)}
          {' · '}
          {s.relativeTime(item.createdAt)}
        </div>
      </div>
      <div className={styles['rowRight']}>
        <Pill>{s.weirdLabel(item.weirdness)}</Pill>
        {item.favorited && (
          <span aria-label={s.savedBadge}>
            <Icon name="Bookmark" size={15} color="var(--accent)" />
          </span>
        )}
        <Icon name="ChevronRight" size={16} color="var(--fg-subtle)" />
      </div>
    </Link>
  );
}
