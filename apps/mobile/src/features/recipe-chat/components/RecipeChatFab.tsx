import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text } from 'react-native';
import { recipeChatStrings as s } from '../strings';

/** Floating extended-pill "Tweak this recipe" FAB, bottom-right (board §✦). */
export function RecipeChatFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable testID="recipe-chat-fab" style={styles.fab} onPress={onPress}>
      <Icon name="Sparkles" size={15} color={tokens.accentFg} />
      <Text style={styles.label}>{s.tweakButton}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 22,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 18,
    borderRadius: 999,
    backgroundColor: tokens.bgInverse,
    boxShadow: '0 12px 28px -8px rgba(14,18,14,0.45)',
  },
  label: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: tokens.accentFg },
});
