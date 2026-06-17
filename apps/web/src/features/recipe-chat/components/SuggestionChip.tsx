import { Icon, type IconName } from '@pantry/design-system/web';
import styles from '../recipe-chat.module.css';

export interface SuggestionChipProps {
  icon: IconName;
  label: string;
  onClick: () => void;
}

/** 1-tap prompt chip (board §✦ entry strip + composer). Not a design-system
 *  primitive — it's specific to the co-pilot's pill-button affordance. */
export function SuggestionChip({ icon, label, onClick }: SuggestionChipProps) {
  return (
    <button type="button" className={styles['suggestionChip']} onClick={onClick}>
      <Icon name={icon} size={14} color="var(--accent)" />
      {label}
    </button>
  );
}
