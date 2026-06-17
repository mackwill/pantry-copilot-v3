import { Icon } from '@pantry/design-system/web';
import { CHAT_SUGGESTIONS, recipeChatStrings as s } from '../strings';
import styles from '../recipe-chat.module.css';
import { SuggestionChip } from './SuggestionChip';

export interface RecipeChatEntryProps {
  /** Open the chat panel; `prompt` pre-fills the composer when a chip is tapped. */
  onOpen: (prompt?: string) => void;
}

/** The accent-soft entry strip under the recipe summary (board §✦ WebRecipeChatEntry). */
export function RecipeChatEntry({ onOpen }: RecipeChatEntryProps) {
  return (
    <div className={styles['entryStrip']}>
      <div className={styles['entrySparkle']}>
        <Icon name="Sparkles" size={16} color="var(--accent-fg)" />
      </div>
      <div className={styles['entryBody']}>
        <div className={styles['entryLead']}>{s.entryPrompt}</div>
        <div className={styles['chipRow']}>
          {CHAT_SUGGESTIONS.map((chip) => (
            <SuggestionChip
              key={chip.label}
              icon={chip.icon}
              label={chip.label}
              onClick={() => {
                onOpen(chip.prompt);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
