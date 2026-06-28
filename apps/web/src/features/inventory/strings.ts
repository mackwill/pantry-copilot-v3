export { categoryLabels, locationLabels, unitLabels } from '../pantry-shared/labels';

export const inventoryStrings = {
  eyebrow: 'Inventory',
  title: 'Your pantry',
  subtitle: (count: number, locations: number): string =>
    `${String(count)} items · across ${String(locations)} locations · last scanned 2 days ago`,
  // The count renders in mono as a separate span; this is the trailing copy after it.
  subtitleRest: (locations: number): string =>
    ` items · across ${String(locations)} locations · last scanned 2 days ago`,
  stats: {
    total: 'Total items',
    expiring: 'Expiring this week',
    pastPrime: 'Past prime',
  },
  columns: {
    item: 'Item',
    qty: 'Qty',
    category: 'Category',
    location: 'Location',
    status: 'Status',
    added: 'Added',
  },
  actions: {
    import: 'Import',
    scan: 'Scan',
    add: 'Add ingredient',
    search: 'Search',
    filter: 'Filter',
  },
  filterAll: 'All',
  empty: 'Nothing here yet. Add your first ingredient.',
  scanModal: {
    title: 'Scanning is in the app',
    body: 'Point-and-scan ingredient capture lives in the Pantry CoPilot mobile app — grab it to scan your shelves.',
    close: 'Got it',
  },
  importModal: {
    title: 'Import items',
    body: 'Paste rows as name, quantity, unit, category, location — one per line. A header row is optional.',
    placeholder: 'Whole milk, 1, gallon, dairy, fridge_top',
    cancel: 'Cancel',
    parsed: (n: number): string => `${String(n)} ready to import`,
    errors: (n: number): string => `${String(n)} row(s) couldn’t be read`,
    importBtn: (n: number): string => (n > 0 ? `Import ${String(n)}` : 'Import'),
    importing: 'Importing…',
  },
} as const;
