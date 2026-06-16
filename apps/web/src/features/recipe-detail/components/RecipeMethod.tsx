import type { RecipeStep } from '@pantry/contracts';
import { Eyebrow } from '@pantry/design-system/web';
import { recipeDetailStrings as s } from '../strings';
import styles from '../recipe-detail.module.css';

export interface RecipeMethodProps {
  steps: readonly RecipeStep[];
}

/** Numbered italic-accent method steps (board §05). */
export function RecipeMethod({ steps }: RecipeMethodProps) {
  return (
    <>
      <Eyebrow style={{ marginBottom: 16 }}>{s.method}</Eyebrow>
      {steps.map((step, index) => (
        <div key={`${String(index)}-step`} className={styles['step']}>
          <div className={styles['stepNum']}>{`${String(index + 1)}.`}</div>
          <div className={styles['stepText']}>{step.text}</div>
        </div>
      ))}
    </>
  );
}
