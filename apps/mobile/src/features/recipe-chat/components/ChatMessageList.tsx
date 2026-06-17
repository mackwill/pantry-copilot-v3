import type { TweakChatState } from '@pantry/utils';
import { fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { recipeChatStrings as s } from '../strings';
import { ChatBubbleAI } from './ChatBubbleAI';
import { ChatBubbleUser } from './ChatBubbleUser';

/** The chat thread: hydrated turns + the in-flight optimistic turn. */
export function ChatMessageList({ state }: { state: TweakChatState }) {
  const streaming = state.pendingUserMessage !== null;
  return (
    <View testID="chat-thread">
      <Text style={styles.threadStart}>{s.threadStart}</Text>
      {state.turns.map((turn) => (
        <Fragment key={turn.turn}>
          <ChatBubbleUser text={turn.userMessage} />
          <ChatBubbleAI summary={turn.summary} changes={turn.changes} />
        </Fragment>
      ))}
      {streaming && (
        <Fragment>
          <ChatBubbleUser text={state.pendingUserMessage ?? ''} />
          <ChatBubbleAI summary={state.streamingSummary.length > 0 ? state.streamingSummary : s.thinking} />
        </Fragment>
      )}
      {state.status === 'error' && state.error !== null && (
        <ChatBubbleAI summary={`${s.errorPrefix}${state.error.message}`} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  threadStart: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 12,
    color: tokens.fgSubtle,
    textAlign: 'center',
    paddingBottom: 12,
  },
});
