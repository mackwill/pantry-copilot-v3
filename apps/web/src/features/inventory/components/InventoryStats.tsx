import type { PantryItem } from '@pantry/contracts';
import { Card } from '@pantry/design-system/web';
import { freshnessFor } from '@pantry/utils';
import type { InventoryStats as Stats } from '../useInventory';
import styles from '../inventory.module.css';
import { inventoryStrings, locationLabels } from '../strings';

type DeltaTone = 'warn' | 'danger' | undefined;

function StatCard({
  label,
  value,
  delta,
  deltaTone,
}: {
  label: string;
  value: number;
  delta: string;
  deltaTone?: DeltaTone;
}) {
  const deltaClass = [styles['statDelta'], deltaTone ? styles[deltaTone] : null]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles['statCard']}>
      <Card>
        <div className={styles['statLabel']}>{label}</div>
        <div className={styles['statValue']}>{value}</div>
        <div className={deltaClass}>{delta}</div>
      </Card>
    </div>
  );
}

function namesByTone(items: PantryItem[], tone: 'warning' | 'danger'): string {
  return items
    .filter((item) => freshnessFor(item.bestBy).tone === tone)
    .map((item) => item.name)
    .join(' · ');
}

export function InventoryStats({ items, stats }: { items: PantryItem[]; stats: Stats }) {
  const locations = [...new Set(items.map((item) => locationLabels[item.location]))].join(' · ');
  const s = inventoryStrings.stats;
  return (
    <div className={styles['stats']}>
      <StatCard label={s.total} value={stats.total} delta={locations} />
      <StatCard
        label={s.expiring}
        value={stats.expiring}
        delta={namesByTone(items, 'warning')}
        deltaTone="warn"
      />
      <StatCard
        label={s.pastPrime}
        value={stats.pastPrime}
        delta={namesByTone(items, 'danger')}
        deltaTone="danger"
      />
    </div>
  );
}
