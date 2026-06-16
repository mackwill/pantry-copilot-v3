import type { RecipeIngredient } from '@pantry/contracts';
import { Eyebrow, Icon, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { ingredientTag } from '../../generation/recipeFormat';
import { recipeDetailStrings as s } from '../strings';

/** "1 bunch", "200 g", "" — the quantity column for an ingredient row. */
function quantityLabel(ingredient: RecipeIngredient): string {
  const qty = ingredient.quantity !== null ? String(ingredient.quantity) : '';
  return [qty, ingredient.unit ?? ''].filter((part) => part.length > 0).join(' ');
}

export interface IngredientBlockProps {
  ingredients: readonly RecipeIngredient[];
  pantryItemsUsed: readonly string[];
}

/** Board §★ inline in-pantry ingredient block — check discs + "M of N in pantry". */
export function IngredientBlock({ ingredients, pantryItemsUsed }: IngredientBlockProps) {
  const have = ingredients.filter((ingredient) => ingredientTag(ingredient, pantryItemsUsed) !== 'optional').length;
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Eyebrow>{s.ingredients}</Eyebrow>
        <Pill tone="success">{s.inPantryPill(have, ingredients.length)}</Pill>
      </View>
      <View style={styles.card}>
        {ingredients.map((ingredient, index) => {
          const filled = ingredientTag(ingredient, pantryItemsUsed) !== 'optional';
          const last = index === ingredients.length - 1;
          return (
            <View key={`${ingredient.name}-${String(index)}`} style={[styles.row, last ? null : styles.rowBorder]}>
              <View style={styles.left}>
                <View style={[styles.disc, filled ? styles.discHave : null]}>
                  {filled ? <Icon name="Check" size={10} color={tokens.accent} /> : null}
                </View>
                <Text style={styles.name}>{ingredient.name}</Text>
              </View>
              <Text style={styles.qty}>{quantityLabel(ingredient)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  card: { backgroundColor: tokens.bgRaised, borderWidth: 1, borderColor: tokens.line, borderRadius: 14, paddingHorizontal: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: tokens.line },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  disc: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.lineStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discHave: { backgroundColor: tokens.accentSoft, borderWidth: 0 },
  name: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: tokens.fg },
  qty: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgMuted },
});
