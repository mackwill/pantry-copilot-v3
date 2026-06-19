import type { PantryItem } from '@pantry/contracts';
import { Button, Card, Eyebrow, Icon, WebShell } from '@pantry/design-system/web';
import { useShellNav, webShellUser } from '../../pantry-shared/nav';
import styles from '../ingredient-form.module.css';
import { ingredientStrings } from '../strings';
import { useIngredientForm } from '../useIngredientForm';
import { BoughtCard } from './BoughtCard';
import { FreshnessCard } from './FreshnessCard';
import { IngredientFields } from './IngredientFields';
import { UseItInCard } from './UseItInCard';

const s = ingredientStrings;

export interface IngredientFormScreenProps {
  item?: PantryItem | undefined;
  user: { name: string; email: string };
}

export function IngredientFormScreen({ item, user }: IngredientFormScreenProps) {
  const form = useIngredientForm(item);
  const shellNav = useShellNav('pantry');
  const title = item === undefined ? s.newTitle : item.name;
  return (
    <WebShell {...shellNav} user={webShellUser(user)} hideTopbar>
      <div className={styles['backRow']}>
        <Button
          kind="ghost"
          size="sm"
          leftIcon={<Icon name="ChevronLeft" size={14} />}
          onClick={() => void form.cancel()}
        >
          {s.back}
        </Button>
        {form.isEditing && <span className={styles['editingNote']}>{s.editingNote}</span>}
      </div>

      <div className={styles['layout']}>
        <div>
          <Eyebrow>{s.eyebrow}</Eyebrow>
          <h1 className={styles['title']}>{title}</h1>
          <Card>
            <IngredientFields values={form.values} setField={form.setField} />
          </Card>
          <div className={styles['actions']}>
            <Button kind="primary" disabled={form.pending} onClick={() => void form.save()}>
              {s.actions.save}
            </Button>
            <Button kind="secondary" onClick={() => void form.cancel()}>
              {s.actions.cancel}
            </Button>
            {form.isEditing && (
              <Button
                kind="danger"
                style={{ marginLeft: 'auto' }}
                leftIcon={<Icon name="Trash2" size={14} color="var(--danger)" />}
                onClick={() => void form.remove()}
              >
                {s.actions.remove}
              </Button>
            )}
          </div>
        </div>

        <div className={styles['sidebar']}>
          <FreshnessCard item={item} />
          <UseItInCard />
          <BoughtCard />
        </div>
      </div>
    </WebShell>
  );
}
