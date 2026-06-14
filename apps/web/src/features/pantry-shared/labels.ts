import type { PantryCategory, PantryLocation, PantryUnit } from '@pantry/contracts';

/** Display labels for the pantry enums — shared across pantry screens (Slices D–H). */
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
  fridge_top: 'Fridge — top shelf',
  fridge_door: 'Fridge — door',
  fridge_crisper: 'Fridge — crisper',
  freezer: 'Freezer',
  pantry_upper: 'Pantry — upper',
  pantry_lower: 'Pantry — lower',
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
