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
} as const;
