import type { ConsumeItem, PantryItem, PantryUnit, RecipeIngredient } from '@pantry/contracts';

/** An editable consume row — a recipe ingredient matched to a real pantry item. */
export interface ConsumeRowModel {
  pantryItemId: string;
  name: string;
  unit: PantryUnit;
  have: number;
  quantityUsed: number;
  finished: boolean;
}

export interface ConsumeRowsResult {
  rows: ConsumeRowModel[];
  /** Recipe ingredients with no pantry match — surfaced in the "missing" box. */
  missing: string[];
}

function matchPantryItem(ingredient: RecipeIngredient, items: readonly PantryItem[]): PantryItem | undefined {
  const target = ingredient.name.trim().toLowerCase();
  return items.find((item) => {
    const name = item.name.trim().toLowerCase();
    return name === target || name.includes(target) || target.includes(name);
  });
}

/**
 * Seed the consume sheet: match each recipe ingredient to a pantry item by name,
 * defaulting the used quantity to what the recipe called for (clamped to stock).
 * Unmatched ingredients become "missing" entries.
 */
export function buildConsumeRows(
  ingredients: readonly RecipeIngredient[],
  pantryItems: readonly PantryItem[],
): ConsumeRowsResult {
  const rows: ConsumeRowModel[] = [];
  const missing: string[] = [];
  const used = new Set<string>();

  for (const ingredient of ingredients) {
    const match = matchPantryItem(ingredient, pantryItems);
    if (match === undefined || used.has(match.id)) {
      missing.push(ingredient.name);
      continue;
    }
    used.add(match.id);
    const have = match.quantity;
    const wanted = ingredient.quantity ?? have;
    const quantityUsed = Math.min(wanted, have);
    rows.push({
      pantryItemId: match.id,
      name: match.name,
      unit: match.unit,
      have,
      quantityUsed,
      finished: quantityUsed >= have,
    });
  }

  return { rows, missing };
}

/** Project the editable rows into the `cook.consume` contract shape. */
export function toConsumeItems(rows: readonly ConsumeRowModel[]): ConsumeItem[] {
  return rows.map((row) => ({
    pantryItemId: row.pantryItemId,
    quantityUsed: row.quantityUsed,
    unit: row.unit,
    finished: row.finished,
  }));
}
