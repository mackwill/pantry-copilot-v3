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
    addPlace: 'Add a place',
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
