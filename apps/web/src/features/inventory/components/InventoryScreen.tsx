import type { PantryItem } from '@pantry/contracts';
import { Button, Card, Icon, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useShellNav, webShellUser } from '../../pantry-shared/nav';
import { useInventory } from '../useInventory';
import { inventoryStrings } from '../strings';
import styles from '../inventory.module.css';
import { CategoryFilter } from './CategoryFilter';
import { InventoryHeader } from './InventoryHeader';
import { InventoryStats } from './InventoryStats';
import { InventoryTable } from './InventoryTable';

export interface InventoryScreenUser {
  name: string;
  email: string;
}

const a = inventoryStrings.actions;

function Topbar({ onAdd, onScan }: { onAdd: () => void; onScan: () => void }) {
  return (
    <>
      <Button kind="secondary" size="sm" leftIcon={<Icon name="Upload" size={14} />}>
        {a.import}
      </Button>
      <Button kind="secondary" size="sm" leftIcon={<Icon name="ScanLine" size={14} />} onClick={onScan}>
        {a.scan}
      </Button>
      <Button
        kind="primary"
        size="sm"
        leftIcon={<Icon name="Plus" size={14} color="#fff" />}
        onClick={onAdd}
      >
        {a.add}
      </Button>
    </>
  );
}

export function InventoryScreen({
  items,
  user,
}: {
  items: PantryItem[];
  user: InventoryScreenUser;
}) {
  const { activeCategory, setActiveCategory, categories, stats, visibleItems, locationsCount } =
    useInventory(items);
  const navigate = useNavigate();
  const shellNav = useShellNav('pantry');
  const [scanOpen, setScanOpen] = useState(false);
  return (
    <WebShell
      {...shellNav}
      user={webShellUser(user)}
      topbarRight={
        <Topbar onAdd={() => void navigate({ to: '/pantry/new' })} onScan={() => { setScanOpen(true); }} />
      }
    >
      <InventoryHeader count={stats.total} locationsCount={locationsCount} />
      <InventoryStats items={items} stats={stats} />
      <CategoryFilter categories={categories} active={activeCategory} onSelect={setActiveCategory} />
      <Card padding={0}>
        <InventoryTable
          items={visibleItems}
          onOpen={(id) => void navigate({ to: '/pantry/$itemId', params: { itemId: id } })}
        />
      </Card>
      {scanOpen && <ScanInfoModal onClose={() => { setScanOpen(false); }} />}
    </WebShell>
  );
}

function ScanInfoModal({ onClose }: { onClose: () => void }) {
  const m = inventoryStrings.scanModal;
  return (
    <div className={styles['scanOverlay']} role="presentation" onClick={onClose}>
      <div
        className={styles['scanCard']}
        role="dialog"
        aria-label={m.title}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <h3 className={styles['scanTitle']}>{m.title}</h3>
        <p className={styles['scanBody']}>{m.body}</p>
        <Button kind="primary" size="sm" onClick={onClose}>
          {m.close}
        </Button>
      </div>
    </div>
  );
}
