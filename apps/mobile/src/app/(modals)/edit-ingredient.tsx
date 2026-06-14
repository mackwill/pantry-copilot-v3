import type { PantryItem } from '@pantry/contracts';
import { fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EditIngredientScreen } from '../../features/ingredient/components/EditIngredientScreen';
import { ingredientRouteStrings } from '../../features/ingredient/routeStrings';
import { api } from '../../lib/api';

export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<PantryItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.pantry.list
      .query()
      .then((rows) => {
        if (!active) return;
        setItem(rows.find((row) => row.id === id));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <View style={styles.loading} />;
  if (item === undefined) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>{ingredientRouteStrings.notFound}</Text>
      </View>
    );
  }
  return <EditIngredientScreen item={item} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: tokens.bgSunk,
  },
  notFound: {
    flex: 1,
    backgroundColor: tokens.bgSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: tokens.fgMuted,
  },
});
