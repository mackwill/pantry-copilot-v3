import type { RecipeDetail } from '@pantry/contracts';
import { Button, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { RecipeChatEntry } from '../../recipe-chat/components/RecipeChatEntry';
import { recipeDetailStrings as s } from '../strings';
import { useFavorite } from '../useFavorite';
import { IngredientBlock } from './IngredientBlock';
import { RecipeMethod } from './RecipeMethod';

export interface RecipeDetailScreenProps {
  recipe: RecipeDetail;
  onBack: () => void;
  onStartCooking?: (() => void) | undefined;
  /** Open the recipe co-pilot; `prompt` pre-fills the composer (entry chip). */
  onTweak?: ((prompt?: string) => void) | undefined;
}

/** Board §05/§07/§✦ mobile recipe detail — meta + inline pantry block + method + tweak entry. */
export function RecipeDetailScreen({ recipe, onBack, onStartCooking, onTweak }: RecipeDetailScreenProps) {
  const { favorited, toggle } = useFavorite(recipe.id, recipe.favorited);

  const shareRecipe = (): void => {
    void Share.share({ title: recipe.title, message: recipe.summary });
  };

  const meta: readonly [string, string][] = [
    [s.metaTime, s.timeValue(recipe.timeMinutes)],
    [s.metaServes, s.servesPlaceholder],
    [s.metaCost, s.costPlaceholder],
  ];

  return (
    <View testID="recipe-detail" style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable testID="recipe-back" onPress={onBack} hitSlop={8}>
            <Icon name="ChevronLeft" size={22} color={tokens.fg} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable testID="favorite-button" onPress={toggle} hitSlop={8}>
              <Icon name="Bookmark" size={20} color={favorited ? tokens.accent : tokens.fg} />
            </Pressable>
            <Pressable testID="recipe-share" onPress={shareRecipe} hitSlop={8}>
              <Icon name="Share2" size={20} color={tokens.fg} />
            </Pressable>
          </View>
        </View>

        <Eyebrow>{s.metaEyebrow(recipe.difficulty, recipe.timeMinutes)}</Eyebrow>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.summary}>{recipe.summary}</Text>

        {onTweak !== undefined && <RecipeChatEntry onOpen={onTweak} />}

        <View style={styles.metaStrip}>
          {meta.map(([key, value]) => (
            <View key={key}>
              <Text style={styles.metaKey}>{key}</Text>
              <Text style={styles.metaVal}>{value}</Text>
            </View>
          ))}
        </View>

        <IngredientBlock ingredients={recipe.ingredients} pantryItemsUsed={recipe.pantryItemsUsed} />
        <RecipeMethod steps={recipe.steps} />

        <Button
          kind="primary"
          full
          size="lg"
          testID="start-cooking"
          leftIcon={<Icon name="Timer" size={16} color={tokens.accentFg} />}
          {...(onStartCooking === undefined ? {} : { onPress: onStartCooking })}
        >
          {s.startCooking}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerActions: { flexDirection: 'row', gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 38, lineHeight: 39, color: tokens.fg },
  summary: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: tokens.fgMuted },
  metaStrip: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.line,
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
  },
  metaKey: { fontFamily: fonts.sans, fontSize: 10, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase', color: tokens.fgSubtle },
  metaVal: { fontFamily: fonts.display, fontSize: 16, color: tokens.fg, marginTop: 2 },
});
