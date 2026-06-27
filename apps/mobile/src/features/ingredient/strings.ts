/**
 * Copy for the Add Ingredient flow. Extended in Slice H2 with the add/edit form
 * strings — keep this module open for extension.
 */
export const sheetStrings = {
  category: {
    eyebrow: 'Category',
    title: 'What kind of thing is this?',
    cancel: 'Cancel',
    use: (label: string): string => `Use ${label}`,
  },
  location: {
    eyebrow: 'Where does it live',
    title: 'Pick a spot',
    use: (label: string): string => `Use ${label}`,
  },
  bestBy: {
    eyebrow: 'Best by',
    title: 'When does it turn?',
    quickPick: 'Quick pick',
    orPickDate: 'Or pick a date',
    dontTrack: "Don't track",
    save: (date: string): string => `Save · ${date}`,
    weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const,
    hintLead: 'Average shelf life for unopened milk is ',
    hintDays: '7 days',
    hintTail: ' past purchase.',
  },
} as const;

/** Copy for the Add & Edit ingredient screens (board MobileAddIngredient / MobileIngredientForm). */
export const formStrings = {
  addTitle: 'Add to pantry',
  editTitle: 'Edit item',
  save: 'Save',
  whatIsIt: 'What is it',
  namePlaceholder: 'e.g. heavy cream',
  manually: 'Manually',
  quantity: 'Quantity',
  unit: 'Unit',
  category: 'Category',
  location: 'Location',
  bestBy: 'Best by',
  details: 'Details',
  freshness: 'Freshness',
  notes: 'Notes',
  useItIn: 'Use it in',
  ingredient: 'Ingredient',
  addToPantry: 'Add to pantry',
  addAnother: 'Add and another',
  remove: 'Remove from pantry',
  autoDetected: 'from receipt scan',
  autoLead: 'auto: best by',
  noBestBy: 'no best-by set',
  quickActions: {
    scan: 'Scan',
  },
  nameSuggestions: ['Milk', 'Eggs', 'Butter', 'Yogurt', 'Cheese'],
  unitPills: ['ea', 'g', 'lb', 'cup'],
  useItInRecipes: [
    'Milk-braised carrots',
    'Burnt-butter milk ramen',
    'Chili-crisp apple ice cream',
  ],
} as const;
