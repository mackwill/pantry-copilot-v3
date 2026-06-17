import { Icon } from '@pantry/design-system/web';
import { useState } from 'react';
import { CHAT_SUGGESTIONS, recipeChatStrings as s } from '../strings';
import styles from '../recipe-chat.module.css';
import { SuggestionChip } from './SuggestionChip';

export interface ChatComposerProps {
  onSend: (prompt: string) => void;
  disabled: boolean;
  /** Pre-fills the input (e.g. from an entry suggestion chip). */
  initialPrompt?: string;
}

/** Suggestion chips + input + send (board §✦ ChatInput). */
export function ChatComposer({ onSend, disabled, initialPrompt = '' }: ChatComposerProps) {
  const [value, setValue] = useState(initialPrompt);
  const canSend = value.trim().length > 0 && !disabled;

  const doSend = (): void => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };

  return (
    <form
      className={styles['composer']}
      onSubmit={(event) => {
        event.preventDefault();
        doSend();
      }}
    >
      <div className={styles['composerChips']}>
        {CHAT_SUGGESTIONS.slice(0, 4).map((chip) => (
          <SuggestionChip
            key={chip.label}
            icon={chip.icon}
            label={chip.label}
            onClick={() => {
              setValue(chip.prompt);
            }}
          />
        ))}
      </div>
      <div className={styles['composerRow']}>
        <input
          className={styles['composerInput']}
          value={value}
          placeholder={s.composerPlaceholder}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          disabled={disabled}
        />
        <button type="submit" className={styles['sendBtn']} disabled={!canSend} aria-label={s.sendLabel}>
          <Icon name="ArrowUp" size={14} color="var(--accent-fg)" />
        </button>
      </div>
    </form>
  );
}
