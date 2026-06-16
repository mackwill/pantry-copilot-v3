import type { ConsumeItem, PantryItem, RecipeDetail } from '@pantry/contracts';
import type { CookSession } from '@pantry/contracts';
import { useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { buildConsumeRows, toConsumeItems } from '../consumeRows';
import { useCookSession } from '../useCookSession';
import { CookSessionScreen } from './CookSessionScreen';
import { EndOfCookAsk } from './EndOfCookAsk';
import { ConsumeSheet } from '../sheets/ConsumeSheet';

export interface CookFlowProps {
  session: CookSession;
  recipe: RecipeDetail;
  pantryItems: readonly PantryItem[];
  /** Leave the cook flow (back to the library tab). */
  onDone: () => void;
}

/** Orchestrates the mobile cook flow: stove → end-of-cook ask → consume sheet. */
export function CookFlow({ session, recipe, pantryItems, onDone }: CookFlowProps) {
  const cook = useCookSession(session, recipe.steps);
  const [phase, setPhase] = useState<'cooking' | 'finished'>('cooking');
  const [sheetOpen, setSheetOpen] = useState(false);

  const consumeData = useMemo(() => buildConsumeRows(recipe.ingredients, pantryItems), [recipe.ingredients, pantryItems]);

  const consume = (items: ConsumeItem[]): void => {
    void api.cook.consume.mutate({ sessionId: session.id, items }).finally(onDone);
  };
  const notNow = (): void => {
    void api.cook.abandon.mutate({ sessionId: session.id }).finally(onDone);
  };

  if (phase === 'cooking') {
    return (
      <CookSessionScreen
        recipeTitle={recipe.title}
        summary={recipe.summary}
        caveat={recipe.caveats[0]}
        cook={cook}
        onExit={onDone}
        onFinish={() => {
          setPhase('finished');
        }}
      />
    );
  }

  return (
    <>
      <EndOfCookAsk
        totalSteps={cook.totalSteps}
        rows={consumeData.rows}
        onConfirm={() => {
          consume(toConsumeItems(consumeData.rows));
        }}
        onAdjust={() => {
          setSheetOpen(true);
        }}
        onNotNow={notNow}
      />
      <ConsumeSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
        }}
        initialRows={consumeData.rows}
        missing={consumeData.missing}
        onDeduct={consume}
      />
    </>
  );
}
