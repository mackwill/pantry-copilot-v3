import type { AIRecipePartial } from '@pantry/contracts';
import { Button, Eyebrow, Icon, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { formatIngredient, ingredientTag } from '../recipeFormat';
import { generationStrings } from '../strings';

const s = generationStrings.result;

export interface OneRecipeCardMobileProps {
  recipe: AIRecipePartial;
  onStartCooking?: (() => void) | undefined;
  onSave?: (() => void) | undefined;
}

/** §02 committed pick — pills, ingredients with provenance, action buttons. */
export function OneRecipeCardMobile({ recipe, onStartCooking, onSave }: OneRecipeCardMobileProps) {
  const ingredients = recipe.ingredients ?? [];
  const pantryUsed = recipe.pantryItemsUsed ?? [];
  const expiringCount = ingredients.filter((i) => ingredientTag(i, pantryUsed) === 'using').length;
  const metaParts = [
    recipe.timeMinutes !== undefined ? s.timeMeta(recipe.timeMinutes) : null,
    recipe.difficulty ?? null,
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);

  return (
    <View style={styles.card} testID="recipe-card-mobile">
      <View style={styles.body}>
        <View style={styles.headRow}>
          <Eyebrow color={tokens.accent}>{s.pick}</Eyebrow>
          {expiringCount > 0 ? <Pill tone="success">{s.usesExpiring(expiringCount)}</Pill> : null}
        </View>
        <Text style={styles.title}>{recipe.title ?? ''}</Text>
        {metaParts.length > 0 ? <Text style={styles.meta}>{metaParts.join(' · ')}</Text> : null}
        {recipe.summary !== undefined && recipe.summary.length > 0 ? (
          <Text style={styles.summary}>{recipe.summary}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Eyebrow style={styles.sectionLabel}>{s.ingredientCount(ingredients.length)}</Eyebrow>
        <View style={styles.ingredients}>
          {ingredients.map((ingredient, index) => {
            const tag = ingredientTag(ingredient, pantryUsed);
            return (
              <Text key={`${ingredient.name}-${String(index)}`} style={styles.ingredient}>
                {formatIngredient(ingredient)}
                {tag === 'using' ? <Text style={styles.usingUp}>{` ${s.usingUp}`}</Text> : null}
                {tag === 'optional' ? <Text style={styles.optional}>{` ${s.optional}`}</Text> : null}
              </Text>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Button kind="primary" size="sm" onPress={onStartCooking} leftIcon={<Icon name="ChefHat" size={13} color={tokens.accentFg} />}>
          {s.startCooking}
        </Button>
        <Button kind="secondary" size="sm" onPress={onSave} leftIcon={<Icon name="Heart" size={13} />}>
          {s.save}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 16,
    overflow: 'hidden',
  },
  body: { padding: 18, gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 31, color: tokens.fg },
  meta: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgMuted },
  summary: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: tokens.fgMuted },
  section: { paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1, borderTopColor: tokens.line, gap: 10 },
  sectionLabel: { marginBottom: 2 },
  ingredients: { gap: 2 },
  ingredient: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 23, color: tokens.fg },
  usingUp: { color: tokens.warning, fontSize: 10 },
  optional: { color: tokens.fgSubtle, fontSize: 10 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: tokens.line, backgroundColor: tokens.bg },
});
