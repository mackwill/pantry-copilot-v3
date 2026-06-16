import { Eyebrow, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { recipeDetailStrings as s } from '../strings';

export interface RecipeMethodProps {
  steps: readonly string[];
}

/** Numbered italic-accent method steps (board §05 mobile). */
export function RecipeMethod({ steps }: RecipeMethodProps) {
  return (
    <View style={styles.wrap}>
      <Eyebrow>{s.method}</Eyebrow>
      {steps.map((step, index) => (
        <View key={`${String(index)}-step`} style={styles.step}>
          <Text style={styles.num}>{`${String(index + 1)}.`}</Text>
          <Text style={styles.text}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  step: { flexDirection: 'row', gap: 10 },
  num: { width: 28, fontFamily: fonts.display, fontSize: 20, fontStyle: 'italic', color: tokens.accent, lineHeight: 22 },
  text: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: tokens.fg },
});
