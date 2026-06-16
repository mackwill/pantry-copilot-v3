import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cookStrings as s } from '../strings';

export interface ResumeBannerProps {
  recipeTitle: string;
  meta: string;
  onResume: () => void;
}

/** Board §03 dark resume banner on the Cook library — leads back to the stove. */
export function ResumeBanner({ recipeTitle, meta, onResume }: ResumeBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.flame}>
        <Icon name="Flame" size={18} color={tokens.stove.accent} />
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          {s.onTheStove(meta)}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {recipeTitle}
        </Text>
      </View>
      <Pressable testID="resume-cooking" onPress={onResume} style={styles.resume} hitSlop={8}>
        <Text style={styles.resumeText}>{s.resume}</Text>
        <Icon name="ArrowRight" size={11} color={tokens.stove.bg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tokens.bgInverse,
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    marginBottom: 18,
  },
  flame: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: tokens.stove.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.stove.accent,
    marginBottom: 3,
  },
  title: { fontFamily: fonts.display, fontSize: 16, lineHeight: 19, color: tokens.fgOnInverse },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: tokens.stove.accent,
    borderRadius: tokens.rPill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resumeText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600', color: tokens.stove.bg },
});
