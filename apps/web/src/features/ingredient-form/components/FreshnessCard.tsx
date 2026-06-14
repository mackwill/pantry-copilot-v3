import type { PantryItem } from '@pantry/contracts';
import { Card, Eyebrow } from '@pantry/design-system/web';
import { freshnessFor } from '@pantry/utils';
import styles from '../ingredient-form.module.css';
import { ingredientStrings } from '../strings';

const s = ingredientStrings;

/** Clamp a days-left figure to a 0–100% bar width (14 days = full). */
function barWidth(daysLeft: number | null): string {
  if (daysLeft === null) return '0%';
  const pct = Math.max(6, Math.min(100, Math.round((daysLeft / 14) * 100)));
  return `${String(pct)}%`;
}

export function FreshnessCard({ item }: { item?: PantryItem | undefined }) {
  const freshness = item === undefined ? null : freshnessFor(item.bestBy);
  const daysLeft = freshness?.daysLeft ?? null;
  return (
    <Card>
      <Eyebrow style={{ marginBottom: 12 }}>{s.sidebar.freshness}</Eyebrow>
      <div className={styles['freshnessBar']}>
        <div className={styles['freshnessFill']} style={{ width: barWidth(daysLeft) }} />
      </div>
      <div className={styles['freshnessMeta']}>
        <span>{s.freshness.openedNote}</span>
        <span>{daysLeft === null ? s.freshness.untracked : s.freshness.leftNote(daysLeft)}</span>
      </div>
    </Card>
  );
}
