import type { RecipeDetail } from '@pantry/contracts';
import { Button, Card, Eyebrow, Icon, Pill, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { api } from '../../../lib/api';
import { useShellNav, webShellUser } from '../../pantry-shared/nav';
import { RecipeChatEntry } from '../../recipe-chat/components/RecipeChatEntry';
import { recipeChatStrings } from '../../recipe-chat/strings';
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
  /** Open the recipe co-pilot; `prompt` pre-fills the composer (entry chip). */
  onTweak?: ((prompt?: string) => void) | undefined;
}

/** Board §05/§07/§✦ web recipe detail — method + sticky ingredients card + copilot note + tweak entry. */
export function RecipeDetailScreen({ user, recipe, onTweak }: RecipeDetailScreenProps) {
  const navigate = useNavigate();
  const shellNav = useShellNav('recipes');
  const { favorited, toggle } = useFavorite(recipe.id, recipe.favorited);
  const note = recipe.observation ?? recipe.whySuggested;

  const startCooking = (): void => {
    void api.cook.start
      .mutate({ recipeId: recipe.id })
      .then(() => navigate({ to: '/cook/session' }))
      .catch(() => undefined);
  };

  const shareRecipe = (): void => {
    // lib.dom types share/clipboard as always-present; narrow to an optional
    // shape so feature detection for older browsers isn't flagged as dead.
    const nav: {
      share?: (data: ShareData) => Promise<void>;
      clipboard?: { writeText: (text: string) => Promise<void> };
    } = navigator;
    const url = window.location.href;
    if (nav.share !== undefined) {
      void nav.share({ title: recipe.title, url }).catch(() => undefined);
    } else {
      void nav.clipboard?.writeText(url).catch(() => undefined);
    }
  };

  const meta: readonly [string, string][] = [
    [s.metaTime, s.timeValue(recipe.timeMinutes)],
    [s.metaServes, s.servesPlaceholder],
    [s.metaEffort, recipe.difficulty],
    [s.metaCost, s.costPlaceholder],
    [s.metaCal, s.calPlaceholder],
  ];

  return (
    <WebShell {...shellNav} user={webShellUser(user)} hideTopbar>
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
          <Button kind="secondary" size="sm" leftIcon={<Icon name="Share2" size={14} />} onClick={shareRecipe}>
            {s.share}
          </Button>
          {onTweak !== undefined && (
            <Button
              kind="inverse"
              size="sm"
              leftIcon={<Icon name="Sparkles" size={14} color="var(--accent-fg)" />}
              onClick={() => {
                onTweak();
              }}
            >
              {recipeChatStrings.tweakButton}
            </Button>
          )}
        </div>
      </div>

      <div className={styles['grid']}>
        <div>
          <Eyebrow>{s.metaEyebrow(recipe.difficulty, recipe.timeMinutes)}</Eyebrow>
          <h1 className={styles['title']}>{recipe.title}</h1>
          <p className={styles['summary']}>{recipe.summary}</p>

          {onTweak !== undefined && <RecipeChatEntry onOpen={onTweak} />}

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
            onStartCooking={startCooking}
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
