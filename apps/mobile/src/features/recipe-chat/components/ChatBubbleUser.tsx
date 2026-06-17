import { fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';

/** The cook's tweak message — inverse bubble, right-aligned (board §✦). */
export function ChatBubbleUser({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 14 },
  bubble: {
    maxWidth: '85%',
    backgroundColor: tokens.bgInverse,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderTopRightRadius: 4,
  },
  text: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: tokens.bg },
});
