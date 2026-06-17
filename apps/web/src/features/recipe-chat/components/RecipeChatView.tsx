import type { RecipeDetail } from '@pantry/contracts';
import type { TweakThreadTurn } from '@pantry/utils';
import { WebShell } from '@pantry/design-system/web';
import { appNavItems, webShellUser } from '../../pantry-shared/nav';
import type { RecipeDetailScreenUser } from '../../recipe-detail/components/RecipeDetailScreen';
import { useRecipeChat, type RevertFn, type TweakSubscribe } from '../useRecipeChat';
import styles from '../recipe-chat.module.css';
import { ChatPanel } from './ChatPanel';
import { RecipeChatDoc } from './RecipeChatDoc';
import { VersionBar } from './VersionBar';

export interface RecipeChatViewProps {
  user: RecipeDetailScreenUser;
  recipe: RecipeDetail;
  turns: TweakThreadTurn[];
  onClose: () => void;
  initialPrompt?: string;
  /** Test seams. */
  subscribe?: TweakSubscribe;
  revertImpl?: RevertFn;
}

/** Board §✦ "chat panel open": live recipe doc (left) + co-pilot panel (right).
 *  Composition-only — the live recipe + thread come from useRecipeChat. */
export function RecipeChatView({ user, recipe, turns, onClose, initialPrompt, subscribe, revertImpl }: RecipeChatViewProps) {
  const chat = useRecipeChat(
    { recipe, recipeId: recipe.id, version: recipe.version, turns },
    {
      ...(subscribe === undefined ? {} : { subscribe }),
      ...(revertImpl === undefined ? {} : { revert: revertImpl }),
    },
  );

  const liveRecipe = chat.recipe ?? recipe;
  const title = liveRecipe.title ?? recipe.title;

  return (
    <WebShell navItems={appNavItems} activeId="recipes" user={webShellUser(user)} hideTopbar>
      <VersionBar
        version={chat.version}
        tweakCount={chat.turns.length}
        onBack={onClose}
        onRevert={chat.revert}
        canRevert={chat.version > 1 && !chat.isStreaming}
      />
      <div className={styles['chatLayout']}>
        <RecipeChatDoc recipe={liveRecipe} />
        <ChatPanel
          state={chat}
          recipeTitle={title}
          onSend={chat.send}
          {...(initialPrompt === undefined ? {} : { initialPrompt })}
        />
      </div>
    </WebShell>
  );
}
