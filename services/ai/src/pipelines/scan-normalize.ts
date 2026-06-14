import {
  type ExtractedIngredient,
  type PantryCategory,
  type PantryLocation,
  type PantryUnit,
  PANTRY_CATEGORIES,
  PANTRY_LOCATIONS,
  PANTRY_UNITS,
  extractedIngredientSchema,
} from '@pantry/contracts';

const UNIT_SET = new Set<string>(PANTRY_UNITS);
const CATEGORY_SET = new Set<string>(PANTRY_CATEGORIES);
const LOCATION_SET = new Set<string>(PANTRY_LOCATIONS);

/** Free-form model unit words → our PANTRY_UNITS. Keys are lowercase + singular. */
const UNIT_ALIASES: Record<string, PantryUnit> = {
  count: 'ea', piece: 'ea', slice: 'ea', clove: 'ea', whole: 'ea', each: 'ea',
  item: 'ea', unit: 'ea', dozen: 'ea', loaf: 'ea', leaf: 'ea', ear: 'ea',
  fillet: 'ea', filet: 'ea', bar: 'ea', roll: 'ea',
  tub: 'jar', container: 'jar', pot: 'jar',
  can: 'tin',
  box: 'pack', carton: 'pack', packet: 'pack', package: 'pack', pkg: 'pack', sleeve: 'pack', tray: 'pack',
  sprig: 'bunch',
  gram: 'g', gramme: 'g', kilogram: 'kg', kilo: 'kg', ounce: 'oz', pound: 'lb',
  tablespoon: 'tbsp', teaspoon: 'tsp',
};

const CATEGORY_ALIASES: Record<string, PantryCategory> = {
  meat: 'protein', seafood: 'protein', fish: 'protein', poultry: 'protein',
  vegetable: 'produce', fruit: 'produce', vegetables: 'produce', fruits: 'produce', herbs: 'produce',
  beverage: 'drinks', beverages: 'drinks', drink: 'drinks',
  frozen: 'freezer',
  bakery: 'pantry', grains: 'pantry', spices: 'pantry', condiments: 'pantry', canned: 'pantry', baking: 'pantry',
  snacks: 'treats', sweets: 'treats', dessert: 'treats', candy: 'treats',
};

const LOCATION_ALIASES: Record<string, PantryLocation> = {
  fridge: 'fridge_top', refrigerator: 'fridge_top', door: 'fridge_door', crisper: 'fridge_crisper',
  pantry: 'pantry_upper', cupboard: 'pantry_upper', shelf: 'pantry_upper',
  counter: 'counter', countertop: 'counter',
};

/** Candidate singular forms, most-specific first (plural rules are ambiguous). */
function singularCandidates(s: string): string[] {
  const out = [s];
  if (s.endsWith('ies') && s.length > 3) out.push(`${s.slice(0, -3)}y`);
  if (s.endsWith('es') && s.length > 3) out.push(s.slice(0, -2));
  if (s.endsWith('s') && s.length > 2) out.push(s.slice(0, -1));
  return out;
}

/** Primary dedupe key form (collapse one layer of pluralization). */
function singular(s: string): string {
  const candidates = singularCandidates(s);
  return candidates[candidates.length - 1] ?? s;
}

function coerce<T extends string>(raw: unknown, allowed: Set<string>, aliases: Record<string, T>): T | null {
  if (typeof raw !== 'string') return null;
  const lower = raw.trim().toLowerCase();
  if (lower === '') return null;
  for (const candidate of singularCandidates(lower)) {
    if (allowed.has(candidate)) return candidate as T;
    const aliased = aliases[candidate];
    if (aliased) return aliased;
  }
  return null;
}

interface RawIngredient {
  name?: unknown;
  normalizedName?: unknown;
  category?: unknown;
  location?: unknown;
  quantity?: unknown;
  unit?: unknown;
  confidence?: unknown;
  notes?: unknown;
}

/**
 * Coerce raw model-emitted ingredients onto our pantry enums (unit/category/
 * location alias maps), then validate each through the contract schema —
 * dropping any item that still can't be parsed (e.g. missing name). The result
 * is always a valid `ExtractedIngredient[]`.
 */
export function normalizeScanIngredients(items: readonly unknown[]): ExtractedIngredient[] {
  return items
    .map((item): unknown => {
      if (!item || typeof item !== 'object') return item;
      const raw = item as RawIngredient;
      return {
        ...raw,
        category: coerce<PantryCategory>(raw.category, CATEGORY_SET, CATEGORY_ALIASES),
        location: coerce<PantryLocation>(raw.location, LOCATION_SET, LOCATION_ALIASES),
        unit: coerce<PantryUnit>(raw.unit, UNIT_SET, UNIT_ALIASES),
      };
    })
    .map((item) => extractedIngredientSchema.safeParse(item))
    .filter((r): r is { success: true; data: ExtractedIngredient } => r.success)
    .map((r) => r.data);
}

function dedupeKey(ing: ExtractedIngredient): string {
  return singular(ing.normalizedName.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' '));
}

/**
 * Collapse ingredients that share a dedupe key (lowercased/singularized
 * `normalizedName`). The highest-confidence entry wins; same-unit quantities
 * are summed; dropped surface names are returned for the scan-level
 * `duplicatesMerged` list.
 */
export function dedupeScanIngredients(items: readonly ExtractedIngredient[]): {
  ingredients: ExtractedIngredient[];
  duplicatesMerged: string[];
} {
  const buckets = new Map<string, ExtractedIngredient>();
  const order: string[] = [];
  const duplicatesMerged: string[] = [];

  for (const item of items) {
    const key = dedupeKey(item);
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, { ...item });
      order.push(key);
      continue;
    }

    const winner = item.confidence > existing.confidence ? item : existing;
    const loser = winner === item ? existing : item;
    duplicatesMerged.push(loser.name);

    const sameUnit = winner.unit === loser.unit && winner.quantity !== null && loser.quantity !== null;
    const quantity = sameUnit ? (winner.quantity ?? 0) + (loser.quantity ?? 0) : winner.quantity;

    buckets.set(key, { ...winner, quantity });
  }

  return { ingredients: order.map((k) => buckets.get(k)).filter((v): v is ExtractedIngredient => v !== undefined), duplicatesMerged };
}
