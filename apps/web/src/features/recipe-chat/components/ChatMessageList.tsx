import type { TweakChatState } from '@pantry/utils';
import { recipeChatStrings as s } from '../strings';
import styles from '../recipe-chat.module.css';
import { ChatBubbleAI } from './ChatBubbleAI';
import { ChatBubbleUser } from './ChatBubbleUser';

/** The chat thread: hydrated turns + the in-flight optimistic turn. */
export function ChatMessageList({ state }: { state: TweakChatState }) {
  const streaming = state.pendingUserMessage !== null;
  return (
    <div className={styles['thread']}>
      <div className={styles['threadStart']}>{s.threadStart}</div>
      {state.turns.map((turn) => (
        <div key={turn.turn}>
          <ChatBubbleUser text={turn.userMessage} />
          <ChatBubbleAI summary={turn.summary} changes={turn.changes} />
        </div>
      ))}
      {streaming && (
        <div>
          <ChatBubbleUser text={state.pendingUserMessage ?? ''} />
          <ChatBubbleAI summary={state.streamingSummary.length > 0 ? state.streamingSummary : s.thinking} />
        </div>
      )}
      {state.status === 'error' && state.error !== null && (
        <ChatBubbleAI summary={`${s.errorPrefix}${state.error.message}`} />
      )}
    </div>
  );
}
