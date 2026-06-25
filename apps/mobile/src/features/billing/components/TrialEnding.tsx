import { Button, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { billingStrings } from '../strings.js';
import { useBilling } from '../useBilling.js';

const strings = billingStrings.trialEnding;

export interface TrialEndingProps {
  onBack?: (() => void) | undefined;
  /** Navigate to cancel-subscription management. */
  onCancel?: (() => void) | undefined;
  onPurchased?: (() => void) | undefined;
}

/** §08 — trial-ending reminder (board `paywall-contextual` · MobileTrialEnding). */
export function TrialEnding({ onBack, onCancel, onPurchased }: TrialEndingProps) {
  const billing = useBilling({
    onPurchased:
      onPurchased === undefined
        ? undefined
        : () => {
            onPurchased();
          },
  });
  const busy = billing.status === 'purchasing' || billing.status === 'restoring';

  const keepPro = (): void => {
    void billing.purchase('pro');
  };
  const switchAnnual = (): void => {
    billing.setAnnual(true);
    void billing.purchase('pro');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable testID="trial-ending-back" onPress={onBack} hitSlop={8}>
            <Icon name="ChevronLeft" size={22} color={tokens.fg} />
          </Pressable>
          <Eyebrow>{strings.eyebrow}</Eyebrow>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.countdownCard}>
          <View style={styles.badgeRow}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>{strings.badge}</Text>
          </View>
          <Text style={styles.countdown}>
            <Text style={styles.countdownEmphasis}>{strings.countdownEmphasis}</Text>
            {`\n${strings.countdownTrail}`}
          </Text>
          <Text style={styles.timeline}>{strings.timeline}</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{strings.progressDay}</Text>
            <Text style={styles.progressLabel}>{strings.progressCharge}</Text>
          </View>
        </View>

        <Eyebrow style={styles.perksEyebrow}>{strings.perksEyebrow}</Eyebrow>
        <View style={styles.perksCard}>
          {strings.perks.map((perk, i) => (
            <View
              key={perk.label}
              style={[styles.perkRow, i < strings.perks.length - 1 ? styles.perkDivider : null]}
            >
              <View style={styles.perkTextGroup}>
                <Text style={styles.perkLabel}>{perk.label}</Text>
                <Text style={styles.perkSub}>{perk.sub}</Text>
              </View>
              <Text style={styles.perkValue}>{perk.value}</Text>
            </View>
          ))}
        </View>

        <Button
          testID="trial-ending-keep"
          kind="primary"
          full
          size="lg"
          disabled={busy}
          onPress={keepPro}
          leftIcon={<Icon name="Check" size={16} color={tokens.accentFg} />}
        >
          {strings.keepPro}
        </Button>
        <Button
          testID="trial-ending-annual"
          kind="secondary"
          full
          size="md"
          style={styles.gapTop}
          disabled={busy}
          onPress={switchAnnual}
        >
          {strings.switchAnnual}
        </Button>
        <Button
          testID="trial-ending-cancel"
          kind="ghost"
          full
          size="md"
          style={styles.cancel}
          onPress={onCancel}
        >
          {strings.cancel}
        </Button>
        <Text style={styles.finePrint}>{strings.finePrint}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  topBarSpacer: { width: 22 },
  countdownCard: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rXl,
    paddingVertical: 22,
    paddingHorizontal: 22,
    marginBottom: 18,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  badgeDot: { width: 6, height: 6, borderRadius: tokens.rPill, backgroundColor: tokens.warning },
  badgeText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 10 * 0.14,
    textTransform: 'uppercase',
    color: tokens.warning,
  },
  countdown: {
    fontFamily: fonts.display,
    fontSize: 58,
    lineHeight: 58,
    letterSpacing: 58 * -0.03,
    color: tokens.fg,
    marginBottom: 6,
  },
  countdownEmphasis: { fontStyle: 'italic', color: tokens.accent },
  timeline: { fontFamily: fonts.mono, fontSize: 12, color: tokens.fgSubtle, marginTop: 8 },
  progressTrack: {
    height: 6,
    borderRadius: tokens.rPill,
    backgroundColor: tokens.bgSunk,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: { height: 6, width: '71%', borderRadius: tokens.rPill, backgroundColor: tokens.warning },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  perksEyebrow: { marginBottom: 10, paddingLeft: 4 },
  perksCard: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rLg,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    gap: 10,
  },
  perkDivider: { borderBottomWidth: 1, borderBottomColor: tokens.line },
  perkTextGroup: { flex: 1 },
  perkLabel: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: tokens.fg },
  perkSub: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle, marginTop: 2 },
  perkValue: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 22 * -0.02, color: tokens.fg },
  gapTop: { marginTop: 8 },
  cancel: { marginTop: 4 },
  finePrint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 11 * 1.5,
    color: tokens.fgSubtle,
    textAlign: 'center',
    marginTop: 10,
  },
});
