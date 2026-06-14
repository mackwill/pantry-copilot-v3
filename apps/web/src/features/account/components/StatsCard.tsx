import { Card } from '@pantry/design-system/web';
import { accountStrings as s } from '../strings';
import styles from '../account.module.css';

export function StatsCard() {
  return (
    <Card>
      <h3 className={styles['cardTitle']}>{s.statsTitle}</h3>
      <div className={styles['statsGrid']}>
        {s.stats.map(([value, label]) => (
          <div key={label} className={styles['statItem']}>
            <span className={styles['statValue']}>{value}</span>
            <span className={styles['statLabel']}>{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
