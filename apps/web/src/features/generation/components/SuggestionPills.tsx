import { Icon } from '@pantry/design-system/web';
import styles from '../generation.module.css';

export interface SuggestionPillsProps {
  suggestions: readonly string[];
  active: readonly string[];
  onToggle: (suggestion: string) => void;
}

/** Board §01 suggestion chips — one tap appends/removes the phrase from the prompt. */
export function SuggestionPills({ suggestions, active, onToggle }: SuggestionPillsProps) {
  return (
    <>
      {suggestions.map((suggestion) => {
        const isActive = active.includes(suggestion);
        return (
          <button
            key={suggestion}
            type="button"
            aria-pressed={isActive}
            className={[styles['chip'], isActive ? styles['chipActive'] : null].filter(Boolean).join(' ')}
            onClick={() => {
              onToggle(suggestion);
            }}
          >
            <Icon name="Plus" size={11} /> {suggestion}
          </button>
        );
      })}
    </>
  );
}
