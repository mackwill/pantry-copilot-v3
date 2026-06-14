import type { PantryItem } from '@pantry/contracts';
import { Pill } from '@pantry/design-system/web';
import { freshnessFor, freshnessLabel } from '@pantry/utils';
import styles from '../inventory.module.css';
import { categoryLabels, inventoryStrings, locationLabels, unitLabels } from '../strings';

const c = inventoryStrings.columns;

/** Compact "added" relative time from an ISO timestamp (e.g. "5d ago", "2w ago"). */
function relativeTime(iso: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return 'today';
  if (days < 7) return `${String(days)}d ago`;
  if (days < 30) return `${String(Math.floor(days / 7))}w ago`;
  return `${String(Math.floor(days / 30))}mo ago`;
}

function InventoryRow({
  item,
  onOpen,
}: {
  item: PantryItem;
  onOpen?: ((id: string) => void) | undefined;
}) {
  const freshness = freshnessFor(item.bestBy);
  const dotClass = `${styles['dot'] ?? ''} ${styles[freshness.tone] ?? ''}`;
  return (
    <div className={styles['row']}>
      <div className={styles['itemCell']}>
        <span className={dotClass} />
        <button type="button" className={styles['itemName']} onClick={() => onOpen?.(item.id)}>
          {item.name}
        </button>
      </div>
      <div className={styles['qtyCell']}>
        {item.quantity} {unitLabels[item.unit]}
      </div>
      <div className={styles['mutedCell']}>{categoryLabels[item.category]}</div>
      <div className={styles['mutedCell']}>{locationLabels[item.location]}</div>
      <div>
        <Pill tone={freshness.tone}>{freshnessLabel(freshness)}</Pill>
      </div>
      <div className={styles['addedCell']}>{relativeTime(item.createdAt)}</div>
    </div>
  );
}

export function InventoryTable({
  items,
  onOpen,
}: {
  items: PantryItem[];
  onOpen?: ((id: string) => void) | undefined;
}) {
  if (items.length === 0) {
    return <div className={styles['empty']}>{inventoryStrings.empty}</div>;
  }
  return (
    <>
      <div className={`${styles['row'] ?? ''} ${styles['headRow'] ?? ''}`}>
        <div>{c.item}</div>
        <div>{c.qty}</div>
        <div>{c.category}</div>
        <div>{c.location}</div>
        <div>{c.status}</div>
        <div className={styles['headRight']}>{c.added}</div>
      </div>
      {items.map((item) => (
        <InventoryRow key={item.id} item={item} onOpen={onOpen} />
      ))}
    </>
  );
}
