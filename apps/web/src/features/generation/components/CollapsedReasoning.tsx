import { Icon } from '@pantry/design-system/web';
import { generationStrings } from '../strings';
import styles from '../generation.module.css';

const s = generationStrings.collapsed;

export interface CollapsedReasoningProps {
  elapsed: string;
  toolCount: number;
  /** Whether the reasoning detail is currently expanded (drives the toggle label). */
  expanded: boolean;
  onToggle: () => void;
  className?: string | undefined;
}

/** Board §04/§02 collapsed reasoning summary — "Thought for 3.4s · N tool calls". */
export function CollapsedReasoning({ elapsed, toolCount, expanded, onToggle, className }: CollapsedReasoningProps) {
  return (
    <div className={[styles['collapsed'], className].filter(Boolean).join(' ')}>
      <Icon name="Check" size={13} color="var(--accent)" />
      <span className={styles['collapsedStrong']}>{s.thoughtFor(elapsed)}</span>
      <span className={styles['collapsedDot']}>{'·'}</span>
      <span className={styles['collapsedMeta']}>{s.summary(toolCount)}</span>
      <button
        type="button"
        className={styles['collapsedShow']}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        {expanded ? s.hideReasoning : s.showReasoning}
      </button>
    </div>
  );
}
