import { Card, Eyebrow, Icon } from '@pantry/design-system/web';
import styles from '../ingredient-form.module.css';
import { ingredientStrings } from '../strings';

const s = ingredientStrings;

/** Static board content (display-only this milestone). */
export function UseItInCard() {
  return (
    <Card>
      <Eyebrow style={{ marginBottom: 12 }}>{s.sidebar.useItIn}</Eyebrow>
      {s.useItInRecipes.map((recipe) => (
        <div key={recipe} className={styles['useItRow']}>
          <span className={styles['useItName']}>{recipe}</span>
          <Icon name="ChevronRight" size={14} color="var(--fg-subtle)" />
        </div>
      ))}
    </Card>
  );
}
