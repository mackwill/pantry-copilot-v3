import { Card } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { accountStrings as s } from '../strings';
import styles from '../account.module.css';

export function PreferencesCard() {
  const navigate = useNavigate();
  return (
    <Card>
      <div className={styles['cardHeader']}>
        <h3 className={styles['cardTitle']}>{s.cookingTitle}</h3>
        <button type="button" className={styles['editLink']} onClick={() => void navigate({ to: '/settings/diet' })}>
          {s.edit}
        </button>
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
