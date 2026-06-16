import type { RecipeListItem } from '@pantry/contracts';
import { Eyebrow, Icon } from '@pantry/design-system/web';
import { libraryStrings as s } from '../strings';
import styles from '../library.module.css';
import { RecipeListCard } from './RecipeListCard';

export interface RecipeLibraryEmptyProps {
  savedCount: number;
  recent: readonly RecipeListItem[];
  onCookNew: () => void;
}

/** Board "Web · Cook · empty" — hero + library/cook-new cards + recently generated. */
export function RecipeLibraryEmpty({ savedCount, recent, onCookNew }: RecipeLibraryEmptyProps) {
  return (
    <>
      <Eyebrow>{s.eyebrow}</Eyebrow>
      <h1 className={styles['headline']}>
        {s.headlineLead}
        <br />
        <em className={styles['headlineAccent']}>{s.headlineAccent}</em>
      </h1>
      <p className={styles['subhead']}>
        {s.subheadLead}
        <span className={styles['subheadStrong']}>{s.subheadAction}</span>
        {s.subheadTail}
      </p>

      <div className={styles['cardGrid']}>
        <div className={styles['contextCard']}>
          <div className={styles['contextHead']}>
            <Icon name="BookOpen" size={16} color="var(--accent)" />
            <Eyebrow style={{ color: 'var(--accent)' }}>{s.pickEyebrow}</Eyebrow>
          </div>
          <div className={styles['contextTitle']}>{s.savedCount(savedCount)}</div>
          <div className={styles['contextSub']}>{s.pickSub}</div>
        </div>

        <button
          type="button"
          className={[styles['contextCard'], styles['contextCardAccent']].join(' ')}
          onClick={onCookNew}
        >
          <div className={styles['contextHead']}>
            <Icon name="Sparkles" size={16} color="var(--accent)" />
            <Eyebrow style={{ color: 'var(--accent)' }}>{s.cookNewEyebrow}</Eyebrow>
          </div>
          <div className={[styles['contextTitle'], styles['contextTitleItalic']].join(' ')}>{s.cookNewTitle}</div>
          <div className={styles['contextSub']}>
            {s.cookNewSub}
            <Icon name="ArrowRight" size={13} color="var(--accent)" />
          </div>
        </button>
      </div>

      {recent.length > 0 && (
        <>
          <Eyebrow style={{ marginBottom: 12 }}>{s.recentEyebrow}</Eyebrow>
          <div className={styles['recentList']}>
            {recent.map((item) => (
              <RecipeListCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
