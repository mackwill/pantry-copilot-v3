import { Card, Eyebrow, Pill } from '@pantry/design-system/web';
import styles from '../ingredient-form.module.css';
import { ingredientStrings } from '../strings';

const s = ingredientStrings;

/** Static board content (display-only this milestone). */
export function BoughtCard() {
  return (
    <Card>
      <Eyebrow style={{ marginBottom: 8 }}>{s.sidebar.bought}</Eyebrow>
      <div className={styles['boughtCopy']}>
        {s.bought.lead} <span className={styles['boughtStrong']}>{s.bought.days}</span>
        {s.bought.tail}
      </div>
      <div className={styles['boughtPills']}>
        <Pill tone="accent">{s.autoAdd}</Pill>
        <Pill tone="outline">{s.off}</Pill>
      </div>
    </Card>
  );
}
