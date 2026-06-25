import { Button, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { PLAN_CATALOG } from '@pantry/contracts';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { billingStrings } from '../strings.js';
import { useBilling } from '../useBilling.js';
import { BillingToggle } from './BillingToggle.js';

const strings = billingStrings.compare;

export interface PaywallBProps {
  onDismiss?: (() => void) | undefined;
  onPurchased?: (() => void) | undefined;
  onRestored?: (() => void) | undefined;
}

/** §04/§12 — receipt/ledger comparison paywall (board `paywall-b` · MobilePaywallB). */
export function PaywallB({ onDismiss, onPurchased, onRestored }: PaywallBProps) {
  const billing = useBilling({
    onPurchased:
      onPurchased === undefined
        ? undefined
        : () => {
            onPurchased();
          },
    onRestored,
  });
  const charge = billing.annual ? strings.chargeAnnual : strings.chargeMonthly;
  const basicPrice = billing.annual ? '$39/yr' : '$4.99/mo';
  const proPrice = billing.annual ? '$79/yr' : '$9.99/mo';
  const busy = billing.status === 'purchasing' || billing.status === 'restoring';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable testID="paywall-close" onPress={onDismiss} hitSlop={8}>
            <Icon name="X" size={22} color={tokens.fgMuted} />
          </Pressable>
          <Pressable
            testID="paywall-restore"
            onPress={() => {
              void billing.restore();
            }}
            hitSlop={8}
          >
            <Text style={styles.restore}>{strings.restore}</Text>
          </Pressable>
        </View>

        <Eyebrow style={styles.eyebrow}>{strings.eyebrow}</Eyebrow>
        <Text style={styles.headline}>
          {`${strings.headlineLead}\n`}
          <Text style={styles.headlineEmphasis}>{strings.headlineEmphasis}</Text>
        </Text>
        <Text style={styles.body}>{strings.body}</Text>

        <BillingToggle annual={billing.annual} onChange={billing.setAnnual} />

        <View style={styles.ledger}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.featureHeader}>{strings.featureHeader}</Text>
            <View style={styles.planHead}>
              <Text style={styles.planName}>{PLAN_CATALOG.basic.name}</Text>
              <Text style={styles.planPrice}>{basicPrice}</Text>
            </View>
            <View style={styles.planHead}>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>{strings.bestBadge}</Text>
              </View>
              <Text style={styles.planName}>{PLAN_CATALOG.pro.name}</Text>
              <Text style={styles.planPrice}>{proPrice}</Text>
            </View>
          </View>
          {strings.rows.map((row, i) => (
            <View
              key={row.label}
              style={[styles.row, i < strings.rows.length - 1 ? styles.rowDivider : null]}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowBasic}>{row.basic}</Text>
              <Text style={styles.rowPro}>{row.pro}</Text>
            </View>
          ))}
        </View>

        <View style={styles.weirdBar} />

        <Button
          testID="paywall-b-pro"
          kind="primary"
          full
          size="lg"
          disabled={busy}
          onPress={() => {
            void billing.purchase('pro');
          }}
          leftIcon={<Icon name="Sparkles" size={16} color={tokens.accentFg} />}
        >
          {strings.startTrial}
        </Button>
        <Button
          testID="paywall-b-basic"
          kind="secondary"
          full
          size="md"
          disabled={busy}
          style={styles.basicCta}
          onPress={() => {
            void billing.purchase('basic');
          }}
        >
          {strings.chooseBasic}
        </Button>
        <Text style={styles.finePrint}>
          {strings.finePrintLead.replace('{charge}', charge)}
          {'\n'}
          {strings.finePrintTrail}
        </Text>
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
    marginBottom: 22,
  },
  restore: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fgMuted },
  eyebrow: { marginBottom: 8 },
  headline: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: 34 * -0.025,
    color: tokens.fg,
    marginBottom: 6,
  },
  headlineEmphasis: { fontStyle: 'italic', color: tokens.fgSubtle },
  body: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.5,
    letterSpacing: 13.5 * -0.005,
    color: tokens.fgMuted,
    marginBottom: 18,
  },
  ledger: {
    marginTop: 22,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: tokens.fg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.fg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  headerRow: {
    alignItems: 'flex-end',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
    borderStyle: 'dashed',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
    borderStyle: 'dashed',
  },
  featureHeader: {
    flex: 1.4,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: tokens.fgSubtle,
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
  },
  planHead: { flex: 0.7, alignItems: 'center' },
  planName: { fontFamily: fonts.display, fontSize: 18, letterSpacing: 18 * -0.02, color: tokens.fg },
  planPrice: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle, marginTop: 2 },
  bestBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: tokens.rPill,
    backgroundColor: tokens.accent,
    marginBottom: 3,
  },
  bestBadgeText: {
    fontFamily: fonts.sans,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 8 * 0.14,
    textTransform: 'uppercase',
    color: tokens.accentFg,
  },
  rowLabel: { flex: 1.4, fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fg },
  rowBasic: {
    flex: 0.7,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: tokens.fgMuted,
    textAlign: 'center',
  },
  rowPro: {
    flex: 0.7,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: tokens.fg,
    textAlign: 'center',
  },
  weirdBar: {
    height: 4,
    borderRadius: tokens.rPill,
    backgroundColor: tokens.accentStrong,
    marginTop: 18,
    marginBottom: 18,
  },
  basicCta: { marginTop: 8 },
  finePrint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 11 * 1.5,
    color: tokens.fgSubtle,
    textAlign: 'center',
    marginTop: 14,
  },
});
