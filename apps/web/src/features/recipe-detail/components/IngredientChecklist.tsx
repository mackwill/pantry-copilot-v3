import type { RecipeIngredient } from '@pantry/contracts';
import { Button, Card, Eyebrow, Icon, Pill } from '@pantry/design-system/web';
import { ingredientTag } from '../../generation/recipeFormat';
import { recipeDetailStrings as s } from '../strings';
import styles from '../recipe-detail.module.css';

/** "1 bunch", "200 g", "" — the quantity column for an ingredient row. */
function quantityLabel(ingredient: RecipeIngredient): string {
  const qty = ingredient.quantity !== null ? String(ingredient.quantity) : '';
  return [qty, ingredient.unit ?? ''].filter((part) => part.length > 0).join(' ');
}

export interface IngredientChecklistProps {
  ingredients: readonly RecipeIngredient[];
  pantryItemsUsed: readonly string[];
  servings: string;
  onStartCooking?: (() => void) | undefined;
}

/** Sticky ingredients-in-pantry card (board §05): check discs + Start cooking. */
export function IngredientChecklist({ ingredients, pantryItemsUsed, servings, onStartCooking }: IngredientChecklistProps) {
  const have = ingredients.filter((ingredient) => ingredientTag(ingredient, pantryItemsUsed) !== 'optional').length;
  return (
    <Card>
      <div className={styles['ingHead']}>
        <Eyebrow>{s.ingredientsEyebrow(servings)}</Eyebrow>
        <Pill tone="success">{s.inPantryPill(have, ingredients.length)}</Pill>
      </div>
      {ingredients.map((ingredient, index) => {
        const filled = ingredientTag(ingredient, pantryItemsUsed) !== 'optional';
        const last = index === ingredients.length - 1;
        const rowClass = [styles['ingRow'], last ? styles['ingRowLast'] : null].filter(Boolean).join(' ');
        const discClass = [styles['ingDisc'], filled ? styles['ingDiscHave'] : null].filter(Boolean).join(' ');
        return (
          <div key={`${ingredient.name}-${String(index)}`} className={rowClass}>
            <div className={styles['ingLeft']}>
              <span className={discClass}>{filled && <Icon name="Check" size={11} color="var(--accent)" />}</span>
              <span className={styles['ingName']}>{ingredient.name}</span>
            </div>
            <span className={styles['ingQty']}>{quantityLabel(ingredient)}</span>
          </div>
        );
      })}
      <Button
        kind="primary"
        full
        size="lg"
        style={{ marginTop: 18 }}
        leftIcon={<Icon name="Utensils" size={16} color="var(--accent-fg)" />}
        {...(onStartCooking === undefined ? {} : { onClick: onStartCooking })}
      >
        {s.startCooking}
      </Button>
    </Card>
  );
}
