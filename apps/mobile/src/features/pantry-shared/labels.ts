import type { PantryCategory, PantryLocation, PantryUnit } from '@pantry/contracts';

/**
 * Mobile pantry display labels. Mirrors the web `pantry-shared/labels` but with
 * SHORT location labels suited to the compact row sub-line. Duplication across
 * apps is intentional (per-app string modules). Reused by Slices G/H/I.
 */
export const categoryLabels: Record<PantryCategory, string> = {
  produce: 'Produce',
  dairy: 'Dairy',
  pantry: 'Pantry',
  protein: 'Protein',
  freezer: 'Freezer',
  drinks: 'Drinks',
  treats: 'Treats',
};

export const locationLabels: Record<PantryLocation, string> = {
  fridge_top: 'Fridge',
  fridge_door: 'Fridge',
  fridge_crisper: 'Fridge',
  freezer: 'Freezer',
  pantry_upper: 'Pantry',
  pantry_lower: 'Pantry',
  counter: 'Counter',
};

export const unitLabels: Record<PantryUnit, string> = {
  ea: 'ea',
  g: 'g',
  kg: 'kg',
  lb: 'lb',
  oz: 'oz',
  cup: 'cup',
  tbsp: 'tbsp',
  tsp: 'tsp',
  gallon: 'gal',
  stick: 'stick',
  pack: 'pack',
  jar: 'jar',
  tin: 'tin',
  bottle: 'btl',
  bunch: 'bunch',
  head: 'head',
  bag: 'bag',
};
