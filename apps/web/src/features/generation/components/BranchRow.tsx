import type { BranchAction } from '@pantry/contracts';
import { Card, Eyebrow, Icon } from '@pantry/design-system/web';
import { BRANCH_TILES, generationStrings } from '../strings';
import styles from '../generation.module.css';

const s = generationStrings.branches;

/** Board §02 branch tiles — four one-tap re-prompts (Weirder/Faster/Vegetarian/Different angle). */
export function BranchRow({ onBranch }: { onBranch: (action: BranchAction) => void }) {
  return (
    <Card padding={0} style={{ padding: '18px 22px' }}>
      <div className={styles['branchHead']}>
        <Eyebrow>{s.eyebrow}</Eyebrow>
        <span className={styles['branchHint']}>{s.hint}</span>
      </div>
      <div className={styles['branchGrid']}>
        {BRANCH_TILES.map((tile) => (
          <button
            key={tile.action}
            type="button"
            className={styles['branchTile']}
            onClick={() => {
              onBranch(tile.action);
            }}
          >
            <div className={styles['branchTileHead']}>
              <Icon name={tile.icon} size={14} color="var(--accent)" />
              <span className={styles['branchLabel']}>{tile.label}</span>
            </div>
            <div className={styles['branchSub']}>{tile.sub}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
