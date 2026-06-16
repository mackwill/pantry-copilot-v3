import { Eyebrow } from '@pantry/design-system/web';
import { cookStrings as s, formatClock } from '../strings';
import styles from '../cook.module.css';

export interface CookingNowBannerProps {
  recipeTitle: string;
  startedAt: string;
  actionLabel: string;
  onAction: () => void;
}

/** Inverse "Cooking now" banner — the in-session header and the library resume row. */
export function CookingNowBanner({ recipeTitle, startedAt, actionLabel, onAction }: CookingNowBannerProps) {
  return (
    <div className={styles['banner']}>
      <span className={styles['bannerDot']} />
      <Eyebrow style={{ color: 'rgba(250,250,247,0.75)' }}>{s.cookingNow}</Eyebrow>
      <span className={styles['bannerTitle']}>{recipeTitle}</span>
      <span className={styles['bannerMeta']}>{s.startedAt(formatClock(startedAt))}</span>
      <button type="button" className={styles['bannerAction']} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  );
}
