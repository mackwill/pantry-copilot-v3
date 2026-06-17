import type { RecipeChange, RecipeChangeTag } from '@pantry/contracts';
import { Icon, type IconName, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { changeChipTone } from '@pantry/utils';
import { StyleSheet, Text, View } from 'react-native';

type Tone = ReturnType<typeof changeChipTone>;

const TONE_BG: Record<Tone, string> = {
  warning: tokens.warningSoft,
  accent: tokens.accentSoft,
  danger: tokens.dangerSoft,
  neutral: tokens.bgSunk,
};
const TONE_FG: Record<Tone, string> = {
  warning: tokens.warningFg,
  accent: tokens.accent,
  danger: tokens.dangerFg,
  neutral: tokens.fgMuted,
};
const TAG_ICON: Record<RecipeChangeTag, IconName> = {
  change: 'Replace',
  add: 'Plus',
  remove: 'Minus',
  note: 'Info',
};

/** A tagged change chip (board §✦). */
export function ChangeChip({ tag, text }: RecipeChange) {
  const tone = changeChipTone(tag);
  return (
    <View style={[styles.chip, { backgroundColor: TONE_BG[tone] }]}>
      <Icon name={TAG_ICON[tag]} size={11} color={TONE_FG[tone]} />
      <Text style={[styles.text, { color: TONE_FG[tone] }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 7,
    paddingRight: 9,
    borderRadius: 8,
    marginRight: 5,
    marginBottom: 5,
  },
  text: { fontFamily: fonts.mono, fontSize: 11.5 },
});
