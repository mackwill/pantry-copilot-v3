export const accountStrings = {
  back: 'Back',
  settingsEyebrow: 'Settings',
  settingsNav: [
    'Account',
    'Pantry preferences',
    'Diet & allergies',
    'Notifications',
    'Connections',
    'Billing',
    'Sign out',
  ] as const,
  title: 'Account',
  fieldLabels: {
    displayName: 'Display name',
    email: 'Email',
    household: 'Household size',
    timezone: 'Time zone',
  },
  staticProfile: {
    household: '2 adults · 1 kid',
    timezone: 'Pacific (PT)',
    joined: 'joined March 2026',
    /** Separator between email and joined date in the profile sub-line. */
    sep: ' · ',
  },
  cookingTitle: 'Cooking preferences',
  edit: 'Edit',
  /** Each row: [label, value]. The value 'curious' is marked as the weirdness display word. */
  cookingRows: [
    ['Default weirdness', 'curious'],
    ['Diet', 'No restrictions'],
    ['Allergies', 'Tree nuts'],
    ['Dislikes', 'Fennel · cilantro (sometimes)'],
    ['Favorite cuisines', 'East Asian · Italian · North African'],
    ['Skill level', 'Comfortable, learning'],
  ] as [string, string][],
  /** The value for the weirdness row — rendered italic/display. */
  weirdnessValue: 'curious',
  statsTitle: 'Stats since you joined',
  stats: [
    ['142', 'meals cooked'],
    ['$680', 'waste avoided'],
    ['38 lbs', 'food not thrown out'],
  ] as [string, string][],
  signOut: 'Sign out',
};
