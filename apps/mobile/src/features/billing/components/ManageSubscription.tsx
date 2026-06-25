import type { SubscriptionState } from '@pantry/contracts';
import { Button, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { billingStrings } from '../strings.js';

const strings = billingStrings.manage;

/** Formats an ISO expiry into a board-style long date, or the unknown dash. */
function formatExpiry(iso: string | null): string {
  if (iso === null) return strings.unknown;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return strings.unknown;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export interface ManageSubscriptionProps {
  subscription: SubscriptionState;
  onBack?: (() => void) | undefined;
  /** Change-plan flows route to the paywall. */
  onChangePlan: () => void;
  onCancel: () => void;
  onRestore: () => void;
  /** Disables actions while a restore/purchase is in flight. */
  busy?: boolean | undefined;
}

/** §13 — manage subscription (board `subscription` · MobileManageSubscription). */
export function ManageSubscription({
  subscription,
  onBack,
  onChangePlan,
  onCancel,
  onRestore,
  busy = false,
}: ManageSubscriptionProps) {
  const dateLabel = subscription.willRenew ? strings.billingRows.renews : strings.billingRows.expires;
  const expiry = formatExpiry(subscription.expiresAt);
  const billingRows: { key: string; value: string }[] = [
    { key: strings.billingRows.plan, value: strings.billingRows.planValue },
    { key: dateLabel, value: expiry },
    { key: strings.billingRows.amount, value: strings.billingRows.amountValue },
    { key: strings.billingRows.method, value: subscription.store ?? strings.unknown },
    { key: strings.billingRows.topUp, value: String(subscription.topUpCredits) },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable testID="manage-back" onPress={onBack} hitSlop={8} aria-label={strings.backLabel}>
            <Icon name="ChevronLeft" size={22} color={tokens.fg} />
          </Pressable>
          <Eyebrow>{strings.eyebrow}</Eyebrow>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroAccent} />
          <Text style={styles.heroEyebrow}>{strings.heroEyebrow}</Text>
          <Text style={styles.heroTitle}>
            {`${strings.heroTitleLead}\n`}
            <Text style={styles.heroTitleEmphasis}>{strings.heroTitleEmphasis}</Text>
          </Text>
          <Text style={styles.heroBlurb}>{strings.heroBlurb}</Text>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>{strings.heroPrice}</Text>
            <Text style={styles.heroFooterText}>{`${dateLabel} ${expiry}`}</Text>
          </View>
        </View>

        <Eyebrow style={styles.eyebrowSpaced}>{strings.usageEyebrow}</Eyebrow>
        <View style={styles.card}>
          {strings.usageRows.map((row, i) => (
            <View
              key={row.label}
              style={[styles.usageRow, i < strings.usageRows.length - 1 ? styles.divider : null]}
            >
              <View style={styles.usageTop}>
                <Text style={styles.usageLabel}>{row.label}</Text>
                <Text style={styles.usageUnlimited}>{strings.usageUnlimited}</Text>
              </View>
              <Text style={styles.usageSub}>{row.sub}</Text>
            </View>
          ))}
        </View>

        <Eyebrow style={styles.eyebrowSpaced}>{strings.billingEyebrow}</Eyebrow>
        <View style={styles.card}>
          {billingRows.map((row, i) => (
            <View
              key={row.key}
              style={[styles.billingRow, i < billingRows.length - 1 ? styles.divider : null]}
            >
              <Text style={styles.billingKey}>{row.key}</Text>
              <Text style={styles.billingVal}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Button
          testID="manage-switch-annual"
          kind="primary"
          full
          size="lg"
          disabled={busy}
          onPress={onChangePlan}
          leftIcon={<Icon name="Sparkles" size={16} color={tokens.accentFg} />}
        >
          {strings.switchAnnual}
        </Button>
        <Button
          testID="manage-downgrade"
          kind="secondary"
          full
          size="md"
          style={styles.gapTop}
          disabled={busy}
          onPress={onChangePlan}
        >
          {strings.downgrade}
        </Button>
        <Button
          testID="manage-restore"
          kind="ghost"
          full
          size="md"
          style={styles.gapTopSm}
          disabled={busy}
          onPress={onRestore}
        >
          {strings.restore}
        </Button>
        <Button
          testID="manage-cancel"
          kind="ghost"
          full
          size="md"
          style={styles.cancel}
          disabled={busy}
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
  screen: { flex: 1, backgroundColor: tokens.bgSunk, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topBarSpacer: { width: 22 },
  hero: {
    backgroundColor: tokens.bgInverse,
    borderRadius: tokens.rXl,
    paddingVertical: 20,
    paddingHorizontal: 22,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: tokens.accent },
  heroEyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 10 * 0.14,
    textTransform: 'uppercase',
    color: tokens.accent,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: 32 * -0.025,
    color: tokens.bg,
    marginBottom: 8,
  },
  heroTitleEmphasis: { fontStyle: 'italic', color: tokens.accent },
  heroBlurb: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 13 * 1.5,
    letterSpacing: 13 * -0.005,
    color: tokens.bgRaised,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: tokens.line,
  },
  heroFooterText: { fontFamily: fonts.mono, fontSize: 11, color: tokens.bgRaised },
  eyebrowSpaced: { marginBottom: 10, paddingLeft: 4 },
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rLg,
    paddingHorizontal: 16,
    marginBottom: 18,
    overflow: 'hidden',
  },
  divider: { borderBottomWidth: 1, borderBottomColor: tokens.line },
  usageRow: { paddingVertical: 12 },
  usageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  usageLabel: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fgMuted },
  usageUnlimited: { fontFamily: fonts.mono, fontSize: 13, color: tokens.fgSubtle },
  usageSub: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
  },
  billingKey: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fgMuted },
  billingVal: { fontFamily: fonts.sans, fontSize: 13, color: tokens.fg },
  gapTop: { marginTop: 8 },
  gapTopSm: { marginTop: 4 },
  cancel: { marginTop: 4 },
  finePrint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 11 * 1.5,
    color: tokens.fgSubtle,
    textAlign: 'center',
    marginTop: 14,
  },
});
