import type { RecipeChange, RecipeChangeTag } from '@pantry/contracts';
import { Icon, type IconName } from '@pantry/design-system/web';
import { changeChipTone } from '@pantry/utils';
import styles from '../recipe-chat.module.css';

const TONE_CLASS: Record<ReturnType<typeof changeChipTone>, string> = {
  warning: styles['toneWarning'] ?? '',
  accent: styles['toneAccent'] ?? '',
  danger: styles['toneDanger'] ?? '',
  neutral: styles['toneNeutral'] ?? '',
};

const TAG_ICON: Record<RecipeChangeTag, IconName> = {
  change: 'Replace',
  add: 'Plus',
  remove: 'Minus',
  note: 'Info',
};

const TONE_COLOR: Record<ReturnType<typeof changeChipTone>, string> = {
  warning: 'var(--warning-fg)',
  accent: 'var(--accent)',
  danger: 'var(--danger-fg)',
  neutral: 'var(--fg-muted)',
};

/** A tagged change chip (board §✦ recipe-chat-b lines 43–60). */
export function ChangeChip({ tag, text }: RecipeChange) {
  const tone = changeChipTone(tag);
  return (
    <span className={[styles['changeChip'], TONE_CLASS[tone]].filter(Boolean).join(' ')}>
      <Icon name={TAG_ICON[tag]} size={11} color={TONE_COLOR[tone]} />
      <span className={styles['changeChipText']} style={{ color: TONE_COLOR[tone] }}>
        {text}
      </span>
    </span>
  );
}
