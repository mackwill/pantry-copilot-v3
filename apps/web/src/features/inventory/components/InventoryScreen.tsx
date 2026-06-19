import type { PantryItem } from '@pantry/contracts';
import { Button, Card, Icon, WebShell } from '@pantry/design-system/web';
import { useNavigate } from '@tanstack/react-router';
import { useShellNav, webShellUser } from '../../pantry-shared/nav';
import { useInventory } from '../useInventory';
import { inventoryStrings } from '../strings';
import { CategoryFilter } from './CategoryFilter';
import { InventoryHeader } from './InventoryHeader';
import { InventoryStats } from './InventoryStats';
import { InventoryTable } from './InventoryTable';

export interface InventoryScreenUser {
  name: string;
  email: string;
}

const a = inventoryStrings.actions;

function Topbar({ onAdd }: { onAdd: () => void }) {
  return (
    <>
      <Button kind="secondary" size="sm" leftIcon={<Icon name="Upload" size={14} />}>
        {a.import}
      </Button>
      <Button kind="secondary" size="sm" leftIcon={<Icon name="ScanLine" size={14} />}>
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
  return (
    <WebShell
      {...shellNav}
      user={webShellUser(user)}
      topbarRight={<Topbar onAdd={() => void navigate({ to: '/pantry/new' })} />}
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
    </WebShell>
  );
}
