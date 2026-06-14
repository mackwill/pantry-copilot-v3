import { Eyebrow } from '@pantry/design-system/web';
import styles from '../inventory.module.css';
import { inventoryStrings } from '../strings';

export interface InventoryHeaderProps {
  count: number;
  locationsCount: number;
}

export function InventoryHeader({ count, locationsCount }: InventoryHeaderProps) {
  return (
    <div className={styles['header']}>
      <div>
        <Eyebrow style={{ marginBottom: 6 }}>{inventoryStrings.eyebrow}</Eyebrow>
        <h1 className={styles['title']}>{inventoryStrings.title}</h1>
        <div className={styles['subtitle']}>
          <span className={styles['subtitleCount']}>{count}</span>
          {inventoryStrings.subtitleRest(locationsCount)}
        </div>
      </div>
    </div>
  );
}
