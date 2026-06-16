import type { RecipeDetail, RecipeIngredient } from '@pantry/contracts';
import { Button, Card, Eyebrow, Icon, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import type { CookSession } from '@pantry/contracts';
import { api } from '../../../lib/api';
import { appNavItems, webShellUser } from '../../pantry-shared/nav';
import { cookStrings as s } from '../strings';
import { useCookSession } from '../useCookSession';
import styles from '../cook.module.css';
import { CookingNowBanner } from './CookingNowBanner';
import { CookTimerRing } from './CookTimerRing';

const NAV_ROUTES: Record<string, string> = { dashboard: '/home', pantry: '/pantry', cook: '/cook', recipes: '/recipes' };

export interface CookSessionScreenUser {
  name: string;
  email: string;
}

export interface CookSessionScreenProps {
  user: CookSessionScreenUser;
  session: CookSession;
  recipe: RecipeDetail;
}

function quantityLabel(ingredient: RecipeIngredient): string {
  const qty = ingredient.quantity !== null ? ingredient.quantity.toString() : '';
  return [qty, ingredient.unit ?? '', ingredient.name].filter((part) => part.length > 0).join(' ');
}

function dotClass(index: number, current: number): string {
  if (index === current) return [styles['dot'], styles['dotCurrent']].join(' ');
  if (index < current) return [styles['dot'], styles['dotDone']].join(' ');
  return styles['dot'] ?? '';
}

/** Board §03.5 web "Cook · in session" — inverse banner, large step, ingredients + timer cards, nav. */
export function CookSessionScreen({ user, session, recipe }: CookSessionScreenProps) {
  const navigate = useNavigate();
  const cook = useCookSession(session, recipe.steps);
  const caveat = recipe.caveats[0];

  const exit = (): void => {
    void api.cook.abandon.mutate({ sessionId: session.id }).catch(() => undefined);
    void navigate({ to: '/recipes' });
  };
  const finish = (): void => {
    void cook.finish().finally(() => {
      void navigate({ to: '/recipes' });
    });
  };

  return (
    <WebShell
      navItems={appNavItems}
      activeId="cook"
      user={webShellUser(user)}
      hideTopbar
      onNavigate={(id) => {
        const to = NAV_ROUTES[id];
        if (to !== undefined) void navigate({ to });
      }}
    >
      <div className={styles['wrap']}>
        <CookingNowBanner recipeTitle={recipe.title} startedAt={session.startedAt} actionLabel={s.exit} onAction={exit} />

        <div className={styles['dots']}>
          {recipe.steps.map((step, index) => (
            <span key={`${index.toString()}-${step.text.slice(0, 8)}`} className={dotClass(index, cook.stepIndex)} />
          ))}
          <span className={styles['dotsLabel']}>
            {s.stepProgress(cook.stepIndex + 1, cook.totalSteps, cook.step?.label)}
          </span>
        </div>

        <h1 className={styles['title']}>{cook.step?.text}</h1>
        {recipe.summary.length > 0 && <p className={styles['summary']}>{recipe.summary}</p>}

        <div className={styles['cardGrid']}>
          <Card padding={20}>
            <div className={styles['usingHead']}>
              <Eyebrow>{s.usingInStep}</Eyebrow>
              <span className={styles['usingCount']}>{s.ingredientCount(recipe.ingredients.length)}</span>
            </div>
            {recipe.ingredients.map((ingredient, index) => (
              <div key={`${ingredient.name}-${index.toString()}`} className={styles['usingRow']}>
                <span className={styles['usingDisc']}>
                  <Icon name="Check" size={10} color="var(--accent)" />
                </span>
                {quantityLabel(ingredient)}
              </div>
            ))}
            {caveat !== undefined && (
              <div className={styles['warnChip']}>
                <Icon name="TriangleAlert" size={13} color="var(--warning-fg)" />
                <span>{caveat}</span>
              </div>
            )}
          </Card>

          <Card padding={20}>
            {cook.secondsRemaining !== null && cook.durationSeconds !== null ? (
              <CookTimerRing
                secondsRemaining={cook.secondsRemaining}
                durationSeconds={cook.durationSeconds}
                label={cook.step?.label ?? s.next}
              />
            ) : (
              <Eyebrow>{s.untimed}</Eyebrow>
            )}
            {cook.nextStep !== undefined && (
              <div className={styles['upNext']}>
                <Eyebrow style={{ marginBottom: 6 }}>{s.upNext}</Eyebrow>
                <div className={styles['upNextText']}>{cook.nextStep.text}</div>
              </div>
            )}
          </Card>
        </div>

        <div className={styles['nav']}>
          <Button
            kind="secondary"
            disabled={cook.isFirst}
            leftIcon={<Icon name="ArrowLeft" size={14} />}
            onClick={cook.goPrev}
          >
            {s.previous}
          </Button>
          {cook.isLast ? (
            <Button kind="primary" leftIcon={<Icon name="Check" size={14} color="var(--accent-fg)" />} onClick={finish}>
              {s.finish}
            </Button>
          ) : (
            <Button kind="primary" rightIcon={<Icon name="ArrowRight" size={14} color="var(--accent-fg)" />} onClick={cook.goNext}>
              {s.next}
            </Button>
          )}
        </div>
      </div>
    </WebShell>
  );
}
