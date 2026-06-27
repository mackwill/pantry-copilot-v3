export const accountStrings = {
  eyebrow: 'Me',
  statsEyebrow: 'Since March',
  stats: [
    ['142', 'meals'],
    ['$680', 'saved'],
    ['38 lbs', 'not wasted'],
  ] as readonly (readonly [string, string])[],
  sections: [
    {
      title: 'Cooking',
      rows: [
        ['Default weirdness', 'curious'],
        ['Diet', 'No restrictions'],
        ['Allergies', 'Tree nuts'],
        ['Skill', 'Comfortable'],
      ] as readonly (readonly [string, string])[],
    },
    {
      title: 'Household',
      rows: [
        ['Size', '2 adults · 1 kid'],
        ['Kitchen', 'One burner, oven, no microwave'],
      ] as readonly (readonly [string, string])[],
    },
    {
      title: 'App',
      rows: [
        ['Notifications', 'Daily, 5pm'],
        ['Connected services', 'Instacart, Apple Health'],
        ['Appearance', 'Auto'],
      ] as readonly (readonly [string, string])[],
    },
  ],
  // The "curious" weirdness value renders in display-font italic.
  // The screen checks row[0] === weirdnessLabel to apply special styling.
  weirdnessLabel: 'Default weirdness',
  /** Cooking-section rows that navigate to the diet & allergies editor. */
  dietRowLabels: ['Diet', 'Allergies'] as readonly string[],
  diet: {
    title: 'Diet & allergies',
    subtitle: 'These guide every recipe the copilot generates for you.',
    dietHeading: 'Dietary preferences',
    allergyHeading: 'Allergies',
    addPlaceholder: 'Add your own…',
    add: 'Add',
    save: 'Save',
    saved: 'Saved',
  },
  signOut: 'Sign out',
  version: 'v1.4.0 · build 214',
} as const;
