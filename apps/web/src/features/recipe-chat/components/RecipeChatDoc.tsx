import type { AIRecipePartial, RecipeIngredient } from '@pantry/contracts';
import { Eyebrow } from '@pantry/design-system/web';
import { recipeChatStrings as s } from '../strings';
import styles from '../recipe-chat.module.css';

function quantityLabel(ingredient: RecipeIngredient): string {
  const qty = ingredient.quantity !== null ? String(ingredient.quantity) : '';
  return [qty, ingredient.unit ?? ''].filter((part) => part.length > 0).join(' ');
}

/** The live recipe-as-document beside the panel; tweaked rows carry the accent
 *  dot + italic label (board §✦ RecipeDoc). Renders defensively from a partial. */
export function RecipeChatDoc({ recipe }: { recipe: AIRecipePartial }) {
  const ingredients = recipe.ingredients ?? [];
  const steps = recipe.steps ?? [];
  const eyebrow =
    recipe.difficulty !== undefined && recipe.timeMinutes !== undefined
      ? `${recipe.difficulty} · ${String(recipe.timeMinutes)} min`
      : s.panelTitle;
  return (
    <div className={styles['doc']}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className={styles['docTitle']}>{recipe.title}</h1>
      {recipe.summary !== undefined && <p className={styles['docSummary']}>{recipe.summary}</p>}

      <Eyebrow style={{ marginBottom: 12 }}>{s.ingredientsEyebrow('2')}</Eyebrow>
      <div className={styles['docIngredients']}>
        {ingredients.map((ingredient, index) => {
          const tweaked = ingredient.edited === true || ingredient.added === true;
          const last = index === ingredients.length - 1;
          return (
            <div
              key={`${ingredient.name}-${String(index)}`}
              className={[styles['docRow'], last ? styles['docRowLast'] : null].filter(Boolean).join(' ')}
            >
              <div className={styles['docRowLeft']}>
                <span className={[styles['docDot'], tweaked ? styles['docDotActive'] : null].filter(Boolean).join(' ')} />
                <span className={styles['docName']}>{ingredient.name}</span>
                {ingredient.added === true && <span className={styles['docTag']}>{s.addedLabel}</span>}
                {ingredient.added !== true && ingredient.edited === true && (
                  <span className={styles['docTag']}>{s.editedLabel}</span>
                )}
              </div>
              <span className={styles['docQty']}>{quantityLabel(ingredient)}</span>
            </div>
          );
        })}
      </div>

      <Eyebrow style={{ marginBottom: 12 }}>{s.method}</Eyebrow>
      {steps.map((step, index) => (
        <div key={`step-${String(index)}`} className={styles['docStep']}>
          <div className={styles['docStepNum']}>{`${String(index + 1)}.`}</div>
          <div className={styles['docStepText']}>{step.text}</div>
        </div>
      ))}
    </div>
  );
}
