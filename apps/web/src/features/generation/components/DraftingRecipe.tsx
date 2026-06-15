import type { AIRecipePartial } from '@pantry/contracts';
import { Eyebrow } from '@pantry/design-system/web';
import { formatIngredient } from '../recipeFormat';
import { generationStrings } from '../strings';
import styles from '../generation.module.css';

const s = generationStrings.drafting;

/** Board §04 Drafting — a single recipe streams top→bottom (no queued cards). */
export function DraftingRecipe({ recipe }: { recipe: AIRecipePartial }) {
  const ingredients = recipe.ingredients ?? [];
  const steps = recipe.steps ?? [];
  const hasSteps = steps.length > 0;
  const metaParts = [
    recipe.timeMinutes !== undefined ? `${recipe.timeMinutes.toString()} min` : null,
    recipe.difficulty,
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);

  return (
    <div className={styles['draftCard']}>
      <div className={styles['draftHead']}>
        <Eyebrow style={{ color: 'var(--accent)' }}>{s.eyebrow}</Eyebrow>
        <span className={styles['draftMetaMono']}>{s.drafting}</span>
      </div>

      <h2 className={styles['draftTitle']}>
        {recipe.title ?? ''}
        {recipe.title !== undefined && !hasSteps && <span className={styles['caret']} />}
      </h2>
      {metaParts.length > 0 && <div className={styles['draftSubMeta']}>{metaParts.join(' · ')}</div>}

      <Eyebrow style={{ marginBottom: 12 }}>{s.ingredients}</Eyebrow>
      <div className={styles['draftIngredients']}>
        {ingredients.map((ingredient, index) => (
          <div key={`${ingredient.name}-${index.toString()}`}>
            {formatIngredient(ingredient)}
            {!hasSteps && index === ingredients.length - 1 && <span className={styles['caret']} />}
          </div>
        ))}
      </div>

      <Eyebrow style={hasSteps ? { marginBottom: 12 } : { marginBottom: 12, opacity: 0.5 }}>{s.method}</Eyebrow>
      {hasSteps ? (
        <div className={styles['steps']}>
          {steps.map((step, index) => (
            <div key={`${index.toString()}-step`} className={styles['stepRow']}>
              <span className={styles['stepNum']}>{`0${(index + 1).toString()}`}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles['draftMethodWaiting']}>{s.methodWaiting}</div>
      )}
    </div>
  );
}
