import type { TweakChatState } from '@pantry/utils';
import { BottomSheet } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Dimensions, StyleSheet, View } from 'react-native';
import { ApplyBar } from '../components/ApplyBar';
import { ChatComposer } from '../components/ChatComposer';
import { ChatMessageList } from '../components/ChatMessageList';

export interface RecipeChatSheetProps {
  open: boolean;
  onClose: () => void;
  state: TweakChatState;
  onSend: (prompt: string) => void;
  onRevert: () => void;
  seedPrompt?: string;
}

const SHEET_HEIGHT = Math.round((Dimensions.get('window').height || 800) * 0.78);

/** Board §✦ mobile chat sheet — composition only. ApplyBar header, thread,
 *  and a sticky composer footer on the canonical animated BottomSheet. */
export function RecipeChatSheet({ open, onClose, state, onSend, onRevert, seedPrompt }: RecipeChatSheetProps) {
  const footer = <ChatComposer onSend={onSend} disabled={state.status === 'streaming'} {...(seedPrompt === undefined ? {} : { initialPrompt: seedPrompt })} />;

  return (
    <BottomSheet open={open} onClose={onClose} height={SHEET_HEIGHT} footer={footer}>
      <View testID="recipe-chat-sheet">
        <ApplyBar tweakCount={state.turns.length} onRevert={onRevert} canRevert={state.version > 1 && state.status !== 'streaming'} />
        <View style={styles.threadWrap}>
          <ChatMessageList state={state} />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  threadWrap: { paddingHorizontal: 16, paddingTop: 14, backgroundColor: tokens.bg },
});
