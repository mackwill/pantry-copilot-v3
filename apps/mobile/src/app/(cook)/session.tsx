import type { CookSession, PantryItem, RecipeDetail } from '@pantry/contracts';
import { tokens } from '@pantry/design-system/tokens';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CookFlow } from '../../features/cook/components/CookFlow';
import { api } from '../../lib/api';

interface Loaded {
  session: CookSession;
  recipe: RecipeDetail;
  pantryItems: PantryItem[];
}

export default function Screen() {
  const router = useRouter();
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const leave = (): void => {
      if (!cancelled) router.replace('/cook');
    };
    api.cook.getActive.query()
      .then((session) => {
        if (session === null) {
          leave();
          return undefined;
        }
        return Promise.all([
          api.recipes.byId.query({ recipeId: session.recipeId }),
          api.pantry.list.query(),
        ]).then(([recipe, pantryItems]) => {
          if (cancelled) return;
          setData({ session, recipe, pantryItems });
          setLoading(false);
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        leave();
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || data === null) return <View style={styles.loading} />;
  return (
    <CookFlow
      session={data.session}
      recipe={data.recipe}
      pantryItems={data.pantryItems}
      onDone={() => {
        router.replace('/cook');
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: tokens.stove.bg },
});
