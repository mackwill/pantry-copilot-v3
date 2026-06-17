import type { RecipeChange } from '@pantry/contracts';
import { Icon } from '@pantry/design-system/web';
import styles from '../recipe-chat.module.css';
import { ChangeChip } from './ChangeChip';

export interface ChatBubbleAIProps {
  summary: string;
  changes?: readonly RecipeChange[];
}

/** The co-pilot's reply: a one-line summary + tagged change chips
 *  (board §✦ — sparkle avatar, summary, chip row). */
export function ChatBubbleAI({ summary, changes }: ChatBubbleAIProps) {
  const hasChanges = changes !== undefined && changes.length > 0;
  return (
    <div className={styles['bubbleAIRow']}>
      <div className={styles['bubbleAISparkle']}>
        <Icon name="Sparkles" size={13} color="var(--accent)" />
      </div>
      <div className={styles['bubbleAIBody']}>
        <div className={[styles['bubbleAISummary'], hasChanges ? styles['bubbleAISummaryGap'] : null].filter(Boolean).join(' ')}>
          {summary}
        </div>
        {hasChanges && (
          <div className={styles['changeChipWrap']}>
            {changes.map((change, i) => (
              <ChangeChip key={`${change.tag}-${String(i)}`} tag={change.tag} text={change.text} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
