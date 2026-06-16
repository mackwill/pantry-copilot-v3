import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { libraryStrings as s } from '../strings';

export interface CookNewButtonProps {
  onPress: () => void;
}

/** Board §03 "Cook something new" entry — opens the NewAskSheet prompt. */
export function CookNewButton({ onPress }: CookNewButtonProps) {
  return (
    <Pressable testID="cook-new-row" style={styles.button} onPress={onPress}>
      <View style={styles.disc}>
        <Icon name="Sparkles" size={15} color={tokens.accentFg} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{s.cookNewTitle}</Text>
        <Text style={styles.sub}>{s.cookNewSub}</Text>
      </View>
      <Icon name="ArrowRight" size={16} color={tokens.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    paddingHorizontal: 16,
    backgroundColor: tokens.accentSoft,
    borderWidth: 1,
    borderColor: tokens.accent,
    borderRadius: 12,
  },
  disc: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: tokens.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.display, fontSize: 16, lineHeight: 19, color: tokens.accent, fontStyle: 'italic' },
  sub: { fontFamily: fonts.sans, fontSize: 11, color: tokens.fgMuted, marginTop: 2 },
});
