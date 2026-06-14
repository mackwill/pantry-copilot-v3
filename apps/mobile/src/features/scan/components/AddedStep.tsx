import { Button, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ScanSummary } from '../useScanFlow';
import { scanStrings } from '../strings';

interface AddedStepProps {
  summary: ScanSummary;
  onSeeIdeas: () => void;
  onViewPantry: () => void;
  onClose: () => void;
}

export function AddedStep({ summary, onSeeIdeas, onViewPantry, onClose }: AddedStepProps) {
  return (
    <View style={styles.root} testID="scan-added">
      <View style={styles.closeRow}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Icon name="X" size={22} color={tokens.fgMuted} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.badge}>
          <Icon name="Check" size={40} color={tokens.accent} />
        </View>
        <Eyebrow>{scanStrings.added.eyebrow}</Eyebrow>
        <Text style={styles.headline}>
          {scanStrings.added.headlineLead}
          <Text style={styles.headlineAccent}>{scanStrings.added.headlineCount(summary.added)}</Text>
        </Text>
        <Text style={styles.body}>{scanStrings.added.body(summary.pantryTotal, summary.attention)}</Text>

        <View style={styles.ideasCard}>
          <View style={styles.ideasIcon}>
            <Icon name="Sparkles" size={18} color={tokens.accent} />
          </View>
          <View style={styles.ideasBody}>
            <Text style={styles.ideasTitle}>{scanStrings.added.ideasTitle}</Text>
            <Text style={styles.ideasSubtitle}>{scanStrings.added.ideasSubtitle}</Text>
          </View>
          <Icon name="ChevronRight" size={16} color={tokens.fgSubtle} />
        </View>
      </View>

      <View style={styles.actions}>
        <Button testID="scan-see-ideas" kind="primary" size="lg" full onPress={onSeeIdeas} leftIcon={<Icon name="ChefHat" size={16} color={tokens.accentFg} />}>
          {scanStrings.added.seeIdeas}
        </Button>
        <Button testID="scan-view-pantry" kind="ghost" full onPress={onViewPantry}>
          {scanStrings.added.viewPantry}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54, paddingHorizontal: 20 },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  badge: { width: 88, height: 88, borderRadius: 999, backgroundColor: tokens.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headline: { fontFamily: fonts.display, fontSize: 40, color: tokens.fg, textAlign: 'center' },
  headlineAccent: { color: tokens.accent },
  body: { fontSize: 15, lineHeight: 23, color: tokens.fgMuted, textAlign: 'center', maxWidth: 280 },
  ideasCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: tokens.bgRaised, borderWidth: 1, borderColor: tokens.line, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginTop: 20, alignSelf: 'stretch' },
  ideasIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: tokens.accentSoft, alignItems: 'center', justifyContent: 'center' },
  ideasBody: { flex: 1 },
  ideasTitle: { fontSize: 13, fontWeight: '500', color: tokens.fg },
  ideasSubtitle: { fontSize: 12, color: tokens.fgMuted, marginTop: 2 },
  actions: { paddingVertical: 24, gap: 8 },
});
