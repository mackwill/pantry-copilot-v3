import type { AIRecipePartial } from '@pantry/contracts';
import { Eyebrow, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { formatIngredient } from '../recipeFormat';
import { generationStrings } from '../strings';
import { Caret } from './Caret';

const s = generationStrings.drafting;

/** §04 Drafting — a single recipe streams top→bottom (no queued cards). */
export function DraftingRecipeMobile({ recipe }: { recipe: AIRecipePartial }) {
  const ingredients = recipe.ingredients ?? [];
  const steps = recipe.steps ?? [];
  const hasSteps = steps.length > 0;
  const metaParts = [
    recipe.timeMinutes !== undefined ? `${String(recipe.timeMinutes)} min` : null,
    recipe.difficulty ?? null,
  ].filter((part): part is string => typeof part === 'string' && part.length > 0);

  return (
    <View style={styles.card} testID="streaming-recipe">
      <View style={styles.head}>
        <Eyebrow color={tokens.accent}>{s.eyebrow}</Eyebrow>
        <Text style={styles.drafting}>{s.drafting}</Text>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{recipe.title ?? ''}</Text>
        {recipe.title !== undefined && !hasSteps ? <Caret /> : null}
      </View>
      {metaParts.length > 0 ? <Text style={styles.subMeta}>{metaParts.join(' · ')}</Text> : null}

      <Eyebrow style={styles.sectionLabel}>{s.ingredients}</Eyebrow>
      <View style={styles.ingredients}>
        {ingredients.map((ingredient, index) => (
          <Text key={`${ingredient.name}-${String(index)}`} style={styles.ingredient}>
            {formatIngredient(ingredient)}
          </Text>
        ))}
      </View>

      {hasSteps ? (
        <View style={styles.steps}>
          {steps.map((step, index) => (
            <View key={`${String(index)}-step`} style={styles.stepRow}>
              <Text style={styles.stepNum}>{`${String(index + 1)}.`}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.methodWaiting}>{s.methodWaiting}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  drafting: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: tokens.fg },
  subMeta: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgMuted },
  sectionLabel: { marginTop: 4 },
  ingredients: { gap: 2 },
  ingredient: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 22, color: tokens.fg },
  methodWaiting: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgSubtle, fontStyle: 'italic' },
  steps: { gap: 10, marginTop: 2 },
  stepRow: { flexDirection: 'row', gap: 10 },
  stepNum: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 16, color: tokens.accent },
  stepText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: tokens.fg },
});
