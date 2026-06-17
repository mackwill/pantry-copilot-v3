import type { RecipeDetail } from '@pantry/contracts';
import type { TweakThreadTurn } from '@pantry/utils';
import { useState } from 'react';
import { View } from 'react-native';
import { RecipeDetailScreen } from '../recipe-detail/components/RecipeDetailScreen';
import { RecipeChatFab } from './components/RecipeChatFab';
import { RecipeChatSheet } from './sheets/RecipeChatSheet';
import { useRecipeChat } from './useRecipeChat';

export interface RecipeChatContainerProps {
  recipe: RecipeDetail;
  turns: TweakThreadTurn[];
  onBack: () => void;
  onStartCooking?: (() => void) | undefined;
}

/** Owns the co-pilot state for the mobile recipe detail: the live recipe (so
 *  the doc behind updates per tweak), the entry affordances, and the chat sheet. */
export function RecipeChatContainer({ recipe, turns, onBack, onStartCooking }: RecipeChatContainerProps) {
  const chat = useRecipeChat({ recipe, recipeId: recipe.id, version: recipe.version, turns });
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<string | undefined>(undefined);

  const liveRecipe: RecipeDetail = {
    ...recipe,
    ...(chat.recipe ?? {}),
    version: chat.version,
    tweakCount: chat.turns.length,
  };

  const openChat = (prompt?: string): void => {
    setSeed(prompt);
    setOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <RecipeDetailScreen
        recipe={liveRecipe}
        onBack={onBack}
        onTweak={openChat}
        {...(onStartCooking === undefined ? {} : { onStartCooking })}
      />
      <RecipeChatFab
        onPress={() => {
          openChat();
        }}
      />
      <RecipeChatSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        state={chat}
        onSend={chat.send}
        onRevert={chat.revert}
        {...(seed === undefined ? {} : { seedPrompt: seed })}
      />
    </View>
  );
}
