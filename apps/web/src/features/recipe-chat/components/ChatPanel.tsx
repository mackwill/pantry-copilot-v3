import type { TweakChatState } from '@pantry/utils';
import { Icon } from '@pantry/design-system/web';
import { recipeChatStrings as s } from '../strings';
import styles from '../recipe-chat.module.css';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';

export interface ChatPanelProps {
  state: TweakChatState;
  recipeTitle: string;
  onSend: (prompt: string) => void;
  initialPrompt?: string;
}

/** The docked right co-pilot panel (board §✦ WebRecipeChatB). */
export function ChatPanel({ state, recipeTitle, onSend, initialPrompt }: ChatPanelProps) {
  return (
    <div className={styles['panel']}>
      <div className={styles['panelInner']}>
        <div className={styles['panelHeader']}>
          <div className={styles['panelSparkle']}>
            <Icon name="Sparkles" size={15} color="var(--accent-fg)" />
          </div>
          <div className={styles['panelTitleCol']}>
            <div className={styles['panelTitle']}>{s.panelTitle}</div>
            <div className={styles['panelSub']}>
              {s.panelTweaking}
              <span className={styles['panelSubName']}>{recipeTitle}</span>
            </div>
          </div>
          <Icon name="MoreHorizontal" size={16} color="var(--fg-muted)" />
        </div>
        <ChatMessageList state={state} />
        <ChatComposer onSend={onSend} disabled={state.status === 'streaming'} {...(initialPrompt === undefined ? {} : { initialPrompt })} />
      </div>
    </div>
  );
}
