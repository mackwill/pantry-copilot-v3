import { Card } from '@pantry/design-system/web';
import { accountStrings as s } from '../strings';
import styles from '../account.module.css';

export function PreferencesCard() {
  return (
    <Card>
      <div className={styles['cardHeader']}>
        <h3 className={styles['cardTitle']}>{s.cookingTitle}</h3>
        <span className={styles['editLink']}>{s.edit}</span>
      </div>
      {s.cookingRows.map(([label, value]) => {
        const isWeirdness = value === s.weirdnessValue;
        return (
          <div key={label} className={styles['prefRow']}>
            <span className={styles['prefLabel']}>{label}</span>
            <span className={isWeirdness ? styles['prefValueWeirdness'] : styles['prefValue']}>
              {value}
            </span>
          </div>
        );
      })}
    </Card>
  );
}
