import type { AIRecipePartial } from '@pantry/contracts';
import { Button, Eyebrow, Icon, Pill } from '@pantry/design-system/web';
import { Link } from '@tanstack/react-router';
import { formatIngredient, ingredientTag } from '../recipeFormat';
import { generationStrings } from '../strings';
import styles from '../generation.module.css';

const s = generationStrings.result;

const TAG_CLASS = { pantry: 'ingTagPantry', using: 'ingTagUsing', optional: 'ingTagOptional' } as const;
const TAG_TEXT = { pantry: s.fromPantry, using: s.usingUp, optional: s.optional } as const;

export interface OneRecipeCardProps {
  recipe: AIRecipePartial;
  /** When the recipe is persisted, its id — turns the title into a link to detail. */
  recipeId?: string | undefined;
  saved?: boolean | undefined;
  onStartCooking?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
}

/** Board §02 committed pick — pills, two-column ingredients/method, actions. */
export function OneRecipeCard({ recipe, recipeId, saved = false, onStartCooking, onSave }: OneRecipeCardProps) {
  const ingredients = recipe.ingredients ?? [];
  const steps = recipe.steps ?? [];
  const pantryUsed = recipe.pantryItemsUsed ?? [];
  const expiringCount = ingredients.filter((i) => ingredientTag(i, pantryUsed) === 'using').length;

  return (
    <div className={styles['recipeCard']}>
      <div className={styles['recipeHeadBlock']}>
        <div className={styles['recipeHeadRow']}>
          <Eyebrow style={{ color: 'var(--accent)' }}>{s.pick}</Eyebrow>
          <div className={styles['recipePills']}>
            {expiringCount > 0 && <Pill tone="success">{s.usesExpiring(expiringCount)}</Pill>}
            <Pill>{s.ingredientCount(ingredients.length)}</Pill>
            {recipe.timeMinutes !== undefined && <Pill>{s.timePill(recipe.timeMinutes)}</Pill>}
          </div>
        </div>
        <h2 className={styles['recipeTitle']}>
          {recipeId !== undefined ? (
            <Link to="/recipes/$recipeId" params={{ recipeId }} className={styles['recipeTitleLink']}>
              {recipe.title ?? ''}
            </Link>
          ) : (
            (recipe.title ?? '')
          )}
        </h2>
        {recipe.summary !== undefined && recipe.summary.length > 0 && <p className={styles['recipeSummary']}>{recipe.summary}</p>}
      </div>

      <div className={styles['recipeCols']}>
        <div className={styles['recipeIngCol']}>
          <Eyebrow style={{ marginBottom: 12 }}>{s.ingredients}</Eyebrow>
          <div className={styles['ingList']}>
            {ingredients.map((ingredient, index) => {
              const tag = ingredientTag(ingredient, pantryUsed);
              return (
                <div key={`${ingredient.name}-${index.toString()}`}>
                  {formatIngredient(ingredient)}
                  <span className={styles[TAG_CLASS[tag]]}>{TAG_TEXT[tag]}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className={styles['recipeMethodCol']}>
          <Eyebrow style={{ marginBottom: 12 }}>{s.methodSteps(steps.length)}</Eyebrow>
          <div className={styles['steps']}>
            {steps.map((step, index) => (
              <div key={`${index.toString()}-step`} className={styles['stepRow']}>
                <span className={styles['stepNum']}>{`0${(index + 1).toString()}`}</span>
                <span>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles['recipeActions']}>
        <Button
          kind="primary"
          leftIcon={<Icon name="Utensils" size={15} color="var(--accent-fg)" />}
          {...(onStartCooking === undefined ? {} : { onClick: onStartCooking })}
        >
          {s.startCooking}
        </Button>
        <Button kind="secondary" leftIcon={<Icon name="Bookmark" size={15} />} {...(onSave === undefined ? {} : { onClick: onSave })}>
          {saved ? s.saved : s.save}
        </Button>
      </div>
    </div>
  );
}
