import type { RecipeDetail } from '@pantry/contracts';
import { fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RecipeDetailScreen } from '../../features/recipe-detail/components/RecipeDetailScreen';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.recipes.byId
      .query({ recipeId })
      .then((row) => {
        if (!active) return;
        setRecipe(row);
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
    <RecipeDetailScreen
      recipe={recipe}
      onBack={() => {
        router.back();
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: tokens.bg },
  notFound: { flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: fonts.sans, fontSize: 14, color: tokens.fgMuted },
});
