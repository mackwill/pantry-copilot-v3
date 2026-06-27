import { z } from 'zod';

/** Standard diet tags offered as quick-pick chips (custom free-text also allowed). */
export const DIET_OPTIONS = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'keto',
  'low_carb',
  'paleo',
  'gluten_free',
  'dairy_free',
] as const;

/** Standard allergy tags offered as quick-pick chips (custom free-text also allowed). */
export const ALLERGY_OPTIONS = [
  'peanuts',
  'tree_nuts',
  'shellfish',
  'fish',
  'eggs',
  'dairy',
  'soy',
  'gluten',
  'sesame',
] as const;

/** A single diet/allergy tag — a standard option or a custom free-text entry. */
const preferenceTagSchema = z.string().trim().min(1).max(40);

export const userPreferencesSchema = z.object({
  diet: z.array(preferenceTagSchema).max(30),
  allergies: z.array(preferenceTagSchema).max(30),
});

/** Input for `user.updatePreferences` — the full desired preference set. */
export const updateUserPreferencesSchema = userPreferencesSchema;

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
