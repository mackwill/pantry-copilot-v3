import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, View } from 'react-native';

/** Streaming caret — a thin accent bar that trails live text. */
export function Caret() {
  return <View style={styles.caret} testID="stream-caret" />;
}

const styles = StyleSheet.create({
  caret: {
    width: 2,
    height: 15,
    marginLeft: 2,
    borderRadius: 1,
    backgroundColor: tokens.accent,
  },
});
