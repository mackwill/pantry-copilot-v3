/** Ingredient form (board §06) copy. Serves both create and edit modes. */
export const ingredientStrings = {
  eyebrow: 'Ingredient',
  back: 'Back to pantry',
  editingNote: '· editing',
  newTitle: 'New ingredient',
  fields: {
    name: 'Name',
    brand: 'Brand (optional)',
    quantity: 'Quantity',
    unit: 'Unit',
    category: 'Category',
    location: 'Location',
    purchased: 'Purchased',
    bestBy: 'Best by',
    notes: 'Notes',
  },
  actions: {
    save: 'Save changes',
    cancel: 'Cancel',
    remove: 'Remove from pantry',
  },
  sidebar: {
    freshness: 'Freshness',
    useItIn: 'Use it in',
    bought: 'Bought',
  },
  freshness: {
    openedNote: 'opened 5 days ago',
    untracked: 'no best-by set',
    leftNote: (daysLeft: number): string =>
      daysLeft < 0
        ? `${String(Math.abs(daysLeft))} days past`
        : daysLeft === 1
          ? '1 day left'
          : `${String(daysLeft)} days left`,
  },
  bought: {
    lead: 'Roughly every',
    days: '11 days',
    tail: '. Suggesting we add to your shopping list automatically.',
  },
  autoAdd: 'Auto-add',
  off: 'Off',
  useItInRecipes: [
    'Milk-braised carrots',
    'Burnt-butter milk ramen',
    'Chili-crisp apple ice cream',
  ],
} as const;
