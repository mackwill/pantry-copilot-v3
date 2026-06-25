import { BottomSheet, Button, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { billingStrings } from '../strings.js';

const strings = billingStrings.limitHit;

export interface LimitHitSheetProps {
  open: boolean;
  onClose: () => void;
  /** Navigate to the paywall (the trial CTA). */
  onUpgrade: () => void;
}

/**
 * §06 — contextual limit-hit bottom sheet (board `paywall-contextual` ·
 * MobileLimitHit). Opens over the cook screen when a generation is blocked by
 * the weekly quota; the primary CTA starts the trial flow via the paywall.
 */
export function LimitHitSheet({ open, onClose, onUpgrade }: LimitHitSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} eyebrow={strings.sheetEyebrow}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.icon}>
            <Icon name="Sparkles" size={18} color={tokens.accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{strings.eyebrow}</Text>
            <Text style={styles.quota}>{strings.quota}</Text>
          </View>
        </View>

        <Text style={styles.headline}>
          {`${strings.headlineLead}\n`}
          <Text style={styles.headlineEmphasis}>{strings.headlineEmphasis}</Text>
        </Text>
        <Text style={styles.bodyText}>{strings.body}</Text>

        <View style={styles.quotaCard}>
          <View style={styles.quotaCardTop}>
            <Text style={styles.quotaCardHeader}>{strings.quotaCardHeader}</Text>
            <Text style={styles.quotaCardCount}>{strings.quotaCardCount}</Text>
          </View>
          <View style={styles.quotaBars}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.quotaBar} />
            ))}
          </View>
          <View style={styles.quotaCardTop}>
            <Text style={styles.quotaResets}>{strings.quotaResets}</Text>
            <Text style={styles.quotaResets}>{strings.quotaUpgrade}</Text>
          </View>
        </View>

        <Button
          testID="limit-hit-upgrade"
          kind="primary"
          full
          size="lg"
          onPress={onUpgrade}
          leftIcon={<Icon name="Sparkles" size={16} color={tokens.accentFg} />}
        >
          {strings.startTrial}
        </Button>
        <Button
          testID="limit-hit-see-plans"
          kind="ghost"
          full
          size="md"
          style={styles.seePlans}
          onPress={onUpgrade}
        >
          {strings.seePlans}
        </Button>
        <Text style={styles.finePrint}>{strings.finePrint}</Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: tokens.rMd,
    backgroundColor: tokens.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  eyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 10 * 0.14,
    textTransform: 'uppercase',
    color: tokens.fgSubtle,
  },
  quota: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: tokens.fg, marginTop: 2 },
  headline: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 31,
    letterSpacing: 30 * -0.025,
    color: tokens.fg,
    marginBottom: 10,
  },
  headlineEmphasis: { fontStyle: 'italic', color: tokens.accent },
  bodyText: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.5,
    letterSpacing: 13.5 * -0.005,
    color: tokens.fgMuted,
    marginBottom: 16,
  },
  quotaCard: {
    backgroundColor: tokens.bgSunk,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rMd,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  quotaCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  quotaCardHeader: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 11 * 0.08,
    textTransform: 'uppercase',
    color: tokens.fgSubtle,
  },
  quotaCardCount: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fg },
  quotaBars: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  quotaBar: { flex: 1, height: 6, borderRadius: 2, backgroundColor: tokens.accent, opacity: 0.85 },
  quotaResets: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  seePlans: { marginTop: 4 },
  finePrint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 11 * 1.5,
    color: tokens.fgSubtle,
    textAlign: 'center',
    marginTop: 10,
  },
});
