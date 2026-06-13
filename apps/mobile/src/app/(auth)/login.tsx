import { Wordmark } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, View } from 'react-native';

/** Placeholder for the Task 14 gate verification — the board §00 screen lands in Task 15. */
export default function LoginRoute() {
  return (
    <View style={styles.screen}>
      <Wordmark size={22} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
