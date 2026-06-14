import type { PantryCategory } from '@pantry/contracts';
import { Button, Icon, Pill } from '@pantry/design-system/web';
import type { CategoryFilter as Filter } from '../useInventory';
import styles from '../inventory.module.css';
import { categoryLabels, inventoryStrings } from '../strings';

export interface CategoryFilterProps {
  categories: readonly PantryCategory[];
  active: Filter;
  onSelect: (category: Filter) => void;
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={styles['pillButton']} onClick={onClick} aria-pressed={active}>
      <Pill
        tone={active ? 'inverse' : 'outline'}
        style={{ cursor: 'pointer', padding: '6px 12px', fontSize: 12 }}
      >
        {label}
      </Pill>
    </button>
  );
}

export function CategoryFilter({ categories, active, onSelect }: CategoryFilterProps) {
  return (
    <div className={styles['filterRow']}>
      <FilterPill
        label={inventoryStrings.filterAll}
        active={active === 'all'}
        onClick={() => {
          onSelect('all');
        }}
      />
      {categories.map((category) => (
        <FilterPill
          key={category}
          label={categoryLabels[category]}
          active={active === category}
          onClick={() => {
            onSelect(category);
          }}
        />
      ))}
      <div className={styles['filterActions']}>
        <Button kind="secondary" size="sm" leftIcon={<Icon name="Search" size={14} />}>
          {inventoryStrings.actions.search}
        </Button>
        <Button kind="secondary" size="sm" leftIcon={<Icon name="Filter" size={14} />}>
          {inventoryStrings.actions.filter}
        </Button>
      </div>
    </div>
  );
}
