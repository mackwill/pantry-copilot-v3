/** All board copy for the mobile §05/§07 recipe detail. */
export const recipeDetailStrings = {
  metaEyebrow: (difficulty: string, min: number): string => `${difficulty} · ${String(min)} min`,
  metaTime: 'time',
  metaServes: 'serves',
  metaCost: 'cost',
  timeValue: (min: number): string => `${String(min)} min`,
  /** Board-fixture placeholders — no per-recipe nutrition/cost data in M5 (decision E). */
  servesPlaceholder: '2',
  costPlaceholder: '$3.40',
  ingredients: 'Ingredients',
  inPantryPill: (have: number, total: number): string => `${String(have)} of ${String(total)} in pantry`,
  method: 'Method',
  startCooking: 'Start cooking',
  notFound: "We couldn't find that recipe.",
} as const;
