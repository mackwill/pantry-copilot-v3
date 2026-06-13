import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, View } from 'react-native';

/** Empty shell for tabs whose real screens land in later milestones. */
export function PlaceholderScreen() {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg },
});
