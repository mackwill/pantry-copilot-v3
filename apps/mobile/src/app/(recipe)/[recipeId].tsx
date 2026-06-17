import type { RecipeDetail } from '@pantry/contracts';
import { fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import type { TweakThreadTurn } from '@pantry/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RecipeChatContainer } from '../../features/recipe-chat/RecipeChatContainer';
import { recipeDetailStrings } from '../../features/recipe-detail/strings';
import { api } from '../../lib/api';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipeId?: string }>();
  const recipeId = firstParam(params.recipeId);
  const [recipe, setRecipe] = useState<RecipeDetail | undefined>(undefined);
  const [turns, setTurns] = useState<TweakThreadTurn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.recipes.byId.query({ recipeId }),
      api.recipes.tweaks.query({ recipeId }).catch(() => []),
    ])
      .then(([row, thread]) => {
        if (!active) return;
        setRecipe(row);
        setTurns(thread.map((t) => ({ turn: t.turn, userMessage: t.userMessage, summary: t.summary, changes: t.changes })));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [recipeId]);

  if (loading) return <View style={styles.loading} />;
  if (recipe === undefined) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{recipeDetailStrings.notFound}</Text>
      </View>
    );
  }
  return (
    <RecipeChatContainer
      recipe={recipe}
      turns={turns}
      onBack={() => {
        router.back();
      }}
      onStartCooking={() => {
        void api.cook.start.mutate({ recipeId }).then(() => {
          router.push('/session');
        });
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: tokens.bg },
  notFound: { flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: fonts.sans, fontSize: 14, color: tokens.fgMuted },
});
