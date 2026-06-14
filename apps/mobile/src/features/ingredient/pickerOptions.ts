import type { PantryCategory, PantryLocation } from '@pantry/contracts';
import type { IconName } from '@pantry/design-system/native';

export interface CategoryOption {
  value: PantryCategory;
  label: string;
  sub: string;
  icon: IconName;
}

export interface LocationOption {
  value: PantryLocation;
  label: string;
  sub: string;
  icon: IconName;
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'produce', label: 'Produce', sub: 'fruit · vegetables · herbs', icon: 'Apple' },
  { value: 'dairy', label: 'Dairy', sub: 'milk · cheese · yogurt · eggs', icon: 'Milk' },
  { value: 'pantry', label: 'Pantry', sub: 'grains · oils · canned · spice', icon: 'Wheat' },
  { value: 'protein', label: 'Protein', sub: 'meat · fish · tofu · beans', icon: 'Beef' },
  { value: 'freezer', label: 'Freezer', sub: 'frozen anything', icon: 'Snowflake' },
  { value: 'drinks', label: 'Drinks', sub: 'juice · soda · alcohol', icon: 'Wine' },
  { value: 'treats', label: 'Treats', sub: 'baked · sweet · chocolate', icon: 'Cookie' },
];

export const LOCATION_OPTIONS: LocationOption[] = [
  { value: 'fridge_top', label: 'Fridge — top shelf', sub: 'most things go here', icon: 'Refrigerator' },
  { value: 'fridge_door', label: 'Fridge — door', sub: 'condiments · drinks', icon: 'Refrigerator' },
  { value: 'fridge_crisper', label: 'Fridge — crisper', sub: 'produce · greens', icon: 'Refrigerator' },
  { value: 'freezer', label: 'Freezer', sub: '6 months avg', icon: 'Snowflake' },
  { value: 'pantry_upper', label: 'Pantry — upper', sub: 'oils · vinegars · cans', icon: 'Archive' },
  { value: 'pantry_lower', label: 'Pantry — lower', sub: 'flour · grains · dry goods', icon: 'Archive' },
  { value: 'counter', label: 'Counter', sub: 'tomatoes · garlic · onions', icon: 'House' },
];

/** Short labels for the location confirm button (e.g. "Use Top shelf"). */
export const LOCATION_SHORT_LABELS: Record<PantryLocation, string> = {
  fridge_top: 'Top shelf',
  fridge_door: 'Door',
  fridge_crisper: 'Crisper',
  freezer: 'Freezer',
  pantry_upper: 'Upper',
  pantry_lower: 'Lower',
  counter: 'Counter',
};
