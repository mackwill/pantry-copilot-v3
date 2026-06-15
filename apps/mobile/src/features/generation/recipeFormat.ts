import type { RecipeIngredient } from '@pantry/contracts';

/** "3 cup cooked rice, day-old" — qty/unit/name/note assembled defensively. */
export function formatIngredient(ingredient: RecipeIngredient): string {
  const qty = ingredient.quantity !== null ? ingredient.quantity.toString() : '';
  const head = [qty, ingredient.unit ?? ''].filter((part) => part.length > 0).join(' ');
  const main = head.length > 0 ? `${head} ${ingredient.name}` : ingredient.name;
  return ingredient.note !== null && ingredient.note.length > 0 ? `${main}, ${ingredient.note}` : main;
}

export type IngredientTag = 'pantry' | 'using' | 'optional';

/** Which provenance tag to show next to an ingredient on the §02 card. */
export function ingredientTag(ingredient: RecipeIngredient, pantryUsed: readonly string[]): IngredientTag {
  if (ingredient.optional) return 'optional';
  const used = pantryUsed.some((name) => name.toLowerCase() === ingredient.name.toLowerCase());
  return used ? 'using' : 'pantry';
}
