import type { RecipeDetail } from '@pantry/contracts';
import { Button, Card, Eyebrow, Icon, Pill, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { appNavItems, webShellUser } from '../../pantry-shared/nav';
import { recipeDetailStrings as s } from '../strings';
import { useFavorite } from '../useFavorite';
import styles from '../recipe-detail.module.css';
import { CopilotNote } from './CopilotNote';
import { IngredientChecklist } from './IngredientChecklist';
import { RecipeMethod } from './RecipeMethod';

export interface RecipeDetailScreenUser {
  name: string;
  email: string;
}

export interface RecipeDetailScreenProps {
  user: RecipeDetailScreenUser;
  recipe: RecipeDetail;
}

/** Board §05/§07 web recipe detail — method + sticky ingredients card + copilot note. */
export function RecipeDetailScreen({ user, recipe }: RecipeDetailScreenProps) {
  const navigate = useNavigate();
  const { favorited, toggle } = useFavorite(recipe.id, recipe.favorited);
  const note = recipe.observation ?? recipe.whySuggested;

  const meta: readonly [string, string][] = [
    [s.metaTime, s.timeValue(recipe.timeMinutes)],
    [s.metaServes, s.servesPlaceholder],
    [s.metaEffort, recipe.difficulty],
    [s.metaCost, s.costPlaceholder],
    [s.metaCal, s.calPlaceholder],
  ];

  return (
    <WebShell navItems={appNavItems} activeId="recipes" user={webShellUser(user)} hideTopbar>
      <div className={styles['topRow']}>
        <Button
          kind="ghost"
          size="sm"
          leftIcon={<Icon name="ArrowLeft" size={14} />}
          onClick={() => void navigate({ to: '/recipes' })}
        >
          {s.back}
        </Button>
        <span className={styles['topMeta']}>
          {s.generatedPrefix}
          {s.relativeTime(recipe.createdAt)}
          {s.generatedFrom}
        </span>
        <div className={styles['topActions']}>
          <Button kind="secondary" size="sm" leftIcon={<Icon name="Bookmark" size={14} />} onClick={toggle}>
            {favorited ? s.saved : s.save}
          </Button>
          <Button kind="secondary" size="sm" leftIcon={<Icon name="Share2" size={14} />}>
            {s.share}
          </Button>
          <Button kind="secondary" size="sm" leftIcon={<Icon name="Printer" size={14} />}>
            {s.print}
          </Button>
        </div>
      </div>

      <div className={styles['grid']}>
        <div>
          <Eyebrow>{s.metaEyebrow(recipe.difficulty, recipe.timeMinutes)}</Eyebrow>
          <h1 className={styles['title']}>{recipe.title}</h1>
          <p className={styles['summary']}>{recipe.summary}</p>

          <div className={styles['metaStrip']}>
            {meta.map(([key, value]) => (
              <div key={key}>
                <div className={styles['metaKey']}>{key}</div>
                <div className={styles['metaVal']}>{value}</div>
              </div>
            ))}
          </div>

          <RecipeMethod steps={recipe.steps} />
          <CopilotNote note={note} />
        </div>

        <div className={styles['rightCol']}>
          <IngredientChecklist
            ingredients={recipe.ingredients}
            pantryItemsUsed={recipe.pantryItemsUsed}
            servings={s.servesPlaceholder}
          />
          {recipe.substitutions.length > 0 && (
            <Card>
              <Eyebrow style={{ marginBottom: 10 }}>{s.couldAlsoUse}</Eyebrow>
              <div className={styles['subs']}>
                {recipe.substitutions.map((sub) => (
                  <Pill key={sub.suggestion}>
                    {s.substitutionPrefix}
                    {sub.suggestion}
                  </Pill>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </WebShell>
  );
}
