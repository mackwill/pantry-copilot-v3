import { Button, Eyebrow, Icon, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { appNavItems, webShellUser } from '../../pantry-shared/nav';
import { useFavorite } from '../../recipe-detail/useFavorite';
import { type GenerationSubscribe, useGeneration } from '../useGeneration';
import { generationStrings } from '../strings';
import styles from '../generation.module.css';
import { BranchRow } from './BranchRow';
import { CollapsedReasoning } from './CollapsedReasoning';
import { DraftingRecipe } from './DraftingRecipe';
import { OneRecipeCard } from './OneRecipeCard';
import { StopButton } from './StopButton';
import { ThinkingPanel } from './ThinkingPanel';
import type { HomeScreenUser } from './HomeScreen';

const t = generationStrings.thinking;
const e = generationStrings.errors;

function secs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Wall-clock elapsed while the stream is open; freezes when it ends. */
function useElapsedMs(active: boolean): number {
  const [ms, setMs] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    startRef.current = performance.now();
    const id = window.setInterval(() => {
      if (startRef.current !== null) setMs(performance.now() - startRef.current);
    }, 100);
    return () => {
      window.clearInterval(id);
    };
  }, [active]);
  return ms;
}

export interface GenerateScreenProps {
  prompt: string;
  weirdness: number;
  user: HomeScreenUser;
  /** Injectable subscription for tests/fidelity; production uses the real tRPC subscription. */
  subscribe?: GenerationSubscribe | undefined;
}

/** Board §04/§02 — switches Thinking → Drafting → Result off the shared stream hook. */
export function GenerateScreen({ prompt, weirdness, user, subscribe }: GenerateScreenProps) {
  const navigate = useNavigate();
  const gen = useGeneration(subscribe === undefined ? undefined : { subscribe });
  const { start } = gen;
  const elapsedMs = useElapsedMs(gen.isStreaming);
  const favorite = useFavorite(gen.recipeId ?? '', false);

  useEffect(() => {
    start({ prompt, pantryItemIds: [], weirdness });
  }, [start, prompt, weirdness]);

  const goHome = (): void => {
    void navigate({ to: '/cook' });
  };
  const elapsed = secs(elapsedMs);
  const thoughtFor = secs(gen.thinkingMs);

  return (
    <WebShell navItems={appNavItems} activeId="cook" user={webShellUser(user)}>
      <div className={gen.status === 'result' ? styles['resultWrap'] : styles['genWrap']}>
        <div className={styles['crumbRow']}>
          <Button kind="ghost" size="sm" leftIcon={<Icon name="ArrowLeft" size={14} />} onClick={goHome}>
            {t.backLabel}
          </Button>
          <span className={styles['crumbCook']}>{t.cookCrumb}</span>
          <span className={styles['crumbStatus']}>{gen.isStreaming ? t.streamOpen(elapsed) : 'copilot · 1 recipe'}</span>
        </div>

        <Eyebrow>{t.yourAsk}</Eyebrow>
        <div className={styles['yourAskValue']}>{`“${prompt}”`}</div>

        {(gen.status === 'idle' || gen.status === 'thinking') && (
          <>
            <ThinkingPanel transcript={gen.transcript} toolCount={gen.tools.length} elapsed={elapsed} />
            <div className={styles['footRow']}>
              <StopButton onStop={gen.stop} />
              <span className={styles['footNote']}>{t.footnote}</span>
            </div>
          </>
        )}

        {gen.status === 'drafting' && (
          <>
            <CollapsedReasoning elapsed={thoughtFor} toolCount={gen.tools.length} />
            {gen.recipe !== null && (
              <div style={{ marginTop: 22 }}>
                <DraftingRecipe recipe={gen.recipe} />
              </div>
            )}
            <div className={styles['footRow']}>
              <StopButton onStop={gen.stop} />
            </div>
          </>
        )}

        {gen.status === 'result' && gen.recipe !== null && (
          <>
            <CollapsedReasoning elapsed={thoughtFor} toolCount={gen.tools.length} className={styles['collapsedResult']} />
            <OneRecipeCard
              recipe={gen.recipe}
              {...(gen.recipeId !== null
                ? { recipeId: gen.recipeId, saved: favorite.favorited, onSave: favorite.toggle }
                : {})}
            />
            <div className={styles['branchSpacer']} />
            <BranchRow onBranch={gen.branch} />
          </>
        )}

        {(gen.status === 'error' || (gen.status === 'aborted' && gen.recipe === null)) && (
          <div className={styles['errorWrap']}>
            <h2 className={styles['errorTitle']}>{gen.status === 'aborted' ? e.aborted : e.title}</h2>
            {gen.error !== null && <p className={styles['errorMessage']}>{gen.error.message}</p>}
            <div className={styles['errorActions']}>
              <Button
                kind="primary"
                onClick={() => {
                  start({ prompt, pantryItemIds: [], weirdness });
                }}
              >
                {e.retry}
              </Button>
              <Button kind="secondary" onClick={goHome}>
                {e.backHome}
              </Button>
            </div>
          </div>
        )}
      </div>
    </WebShell>
  );
}
