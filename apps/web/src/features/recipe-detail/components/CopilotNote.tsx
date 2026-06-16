import { Icon } from '@pantry/design-system/web';
import { recipeDetailStrings as s } from '../strings';
import styles from '../recipe-detail.module.css';

export interface CopilotNoteProps {
  note: string;
}

/** The accent-soft "Notes from the copilot" card (board §05). */
export function CopilotNote({ note }: CopilotNoteProps) {
  return (
    <div className={styles['copilot']}>
      <div className={styles['copilotRow']}>
        <Icon name="Sparkles" size={18} color="var(--accent)" />
        <div>
          <div className={styles['copilotTitle']}>{s.copilotTitle}</div>
          <div className={styles['copilotBody']}>{note}</div>
        </div>
      </div>
    </div>
  );
}
