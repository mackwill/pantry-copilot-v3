import { Card, Eyebrow, Icon, Pill, type PillTone } from '@pantry/design-system/web';
import { generationStrings } from '../strings';
import styles from '../generation.module.css';

const s = generationStrings.home;

export interface ExpiringEntry {
  name: string;
  qty: string;
  exp: string;
  tone: PillTone;
}

export interface RecentEntry {
  title: string;
  when: string;
  time: string;
}

export interface HomeContextCardsProps {
  expiring: readonly ExpiringEntry[];
  recent: readonly RecentEntry[];
  /** The "Try: …" prompt hint under the expiring card. */
  tryHint: string | null;
}

/** Board §01 ambient context — "Want using soon" + "Recently saved". */
export function HomeContextCards({ expiring, recent, tryHint }: HomeContextCardsProps) {
  return (
    <div className={styles['contextGrid']}>
      <Card padding={0} style={{ padding: '20px 22px' }}>
        <div className={styles['ctxHead']}>
          <Eyebrow>{s.contextWantUsing}</Eyebrow>
          <span className={styles['ctxLink']}>{s.pantryLink}</span>
        </div>
        {expiring.map((row) => (
          <div key={row.name} className={styles['ctxRow']}>
            <div>
              <div className={styles['ctxName']}>{row.name}</div>
              <div className={styles['ctxSub']}>{row.qty}</div>
            </div>
            <Pill tone={row.tone}>{row.exp}</Pill>
          </div>
        ))}
        {tryHint !== null && (
          <div className={styles['ctxTry']}>
            <Icon name="Lightbulb" size={13} color="var(--accent)" />
            <span>
              {s.tryPrefix} <em className={styles['ctxTryQuote']}>{`“${tryHint}”`}</em>
            </span>
          </div>
        )}
      </Card>

      <Card padding={0} style={{ padding: '20px 22px' }}>
        <div className={styles['ctxHead']}>
          <Eyebrow>{s.contextRecentlySaved}</Eyebrow>
          <span className={styles['ctxLink']}>{s.recipesLink}</span>
        </div>
        {recent.map((row) => (
          <div key={row.title} className={styles['ctxRow']}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className={styles['ctxNameDisplay']}>{row.title}</div>
              <div className={styles['ctxSub']}>{row.when}</div>
            </div>
            <span className={styles['ctxSub']}>{row.time}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
