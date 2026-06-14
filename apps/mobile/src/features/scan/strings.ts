const thing = (n: number): string => (n === 1 ? 'thing' : 'things');
const item = (n: number): string => (n === 1 ? 'item' : 'items');

const attentionLine = (n: number): string => {
  if (n <= 0) return '';
  if (n === 1) return ' One of them wants attention soon.';
  return ` ${String(n)} of them want attention soon.`;
};

export const scanStrings = {
  viewfinder: {
    badge: 'Scan pantry',
    hint: 'Point at your open fridge or cupboard',
    permissionTitle: 'Camera access needed',
    permissionBody: 'Allow camera access to scan your pantry, or use a sample image.',
    permissionCta: 'Allow camera',
    useSample: 'Use a sample image',
  },
  detecting: {
    eyebrow: 'Detecting',
    progress: (n: number): string => `Found ${String(n)} ${item(n)} so far…`,
  },
  review: {
    complete: 'Scan complete',
    eyebrow: 'Review scan',
    titleLead: 'Found ',
    titleCount: (n: number): string => String(n),
    titleTrail: (n: number): string => ` ${thing(n)}.`,
    subtitle: 'Tap to edit or remove. Anything we guessed wrong?',
    lowConfidence: 'low confidence',
    addMissing: 'Add something we missed',
    addToPantry: (n: number): string => `Add ${String(n)} to pantry`,
    untitledItem: 'New item',
  },
  added: {
    eyebrow: 'Pantry updated',
    headlineLead: 'Added ',
    headlineCount: (n: number): string => `${String(n)} ${thing(n)}.`,
    body: (total: number, attention: number): string =>
      `Your pantry now holds ${String(total)} ${item(total)}.${attentionLine(attention)}`,
    ideasTitle: '3 new ideas ready',
    ideasSubtitle: 'Including one for those scallions',
    seeIdeas: "See tonight's ideas",
    viewPantry: 'View pantry',
  },
  errors: {
    extract: 'We could not read that photo. Try again.',
    confirm: 'Something went wrong adding those items. Try again.',
  },
} as const;
