import { Button, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { PLAN_CATALOG } from '@pantry/contracts';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { billingStrings } from '../strings.js';
import { useBilling } from '../useBilling.js';
import { BillingToggle } from './BillingToggle.js';
import { PlanOption } from './PlanOption.js';

const strings = billingStrings.paywall;

export interface PaywallAProps {
  onDismiss?: (() => void) | undefined;
  /** Fired after a successful purchase + server sync. */
  onPurchased?: (() => void) | undefined;
  /** Fired after a successful restore + server sync. */
  onRestored?: (() => void) | undefined;
}

/** §02/§11 — editorial "hero" paywall (board `paywall-a` · MobilePaywallA). */
export function PaywallA({ onDismiss, onPurchased, onRestored }: PaywallAProps) {
  const billing = useBilling({
    onPurchased:
      onPurchased === undefined
        ? undefined
        : () => {
            onPurchased();
          },
    onRestored,
  });
  const price = billing.annual ? '$79/yr' : '$9.99/mo';
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

        <View style={styles.foodSlot}>
          <Text style={styles.foodSlotLabel}>{strings.foodSlotHero}</Text>
        </View>

        <Eyebrow style={styles.eyebrow}>{strings.eyebrow}</Eyebrow>
        <Text style={styles.headline}>
          {`${strings.headlineLead}\n`}
          <Text style={styles.headlineEmphasis}>{strings.headlineEmphasis}</Text>
        </Text>
        <Text style={styles.body}>{strings.body}</Text>

        <View style={styles.weirdBar} />

        <BillingToggle annual={billing.annual} onChange={billing.setAnnual} />

        <View style={styles.plans}>
          <PlanOption
            plan={PLAN_CATALOG.pro}
            annual={billing.annual}
            selected={billing.selectedPlan === 'pro'}
            highlight
            onSelect={billing.selectPlan}
          />
          <PlanOption
            plan={PLAN_CATALOG.basic}
            annual={billing.annual}
            selected={billing.selectedPlan === 'basic'}
            onSelect={billing.selectPlan}
          />
        </View>

        <View style={styles.features}>
          {strings.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.featureTick}>
                <Icon name="Check" size={10} color={tokens.accent} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Button
          testID="paywall-cta"
          kind="primary"
          full
          size="lg"
          disabled={busy}
          onPress={() => {
            void billing.purchase(billing.selectedPlan);
          }}
          leftIcon={<Icon name="Sparkles" size={16} color={tokens.accentFg} />}
        >
          {strings.startTrial}
        </Button>
        <Text style={styles.finePrint}>
          {strings.finePrintLead.replace('{price}', price)}
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
  restore: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.accent },
  foodSlot: {
    aspectRatio: 16 / 10,
    backgroundColor: tokens.bgSunk,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rLg,
    justifyContent: 'flex-end',
    padding: 14,
    marginBottom: 22,
  },
  foodSlotLabel: {
    alignSelf: 'flex-start',
    fontFamily: fonts.mono,
    fontSize: 11,
    color: tokens.fgSubtle,
    backgroundColor: tokens.bgRaised,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: tokens.rSm,
  },
  eyebrow: { marginBottom: 8 },
  headline: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: 36 * -0.025,
    color: tokens.fg,
    marginBottom: 12,
  },
  headlineEmphasis: { fontStyle: 'italic', color: tokens.accent },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14 * 1.55,
    letterSpacing: 14 * -0.005,
    color: tokens.fgMuted,
    marginBottom: 18,
  },
  weirdBar: {
    height: 5,
    borderRadius: tokens.rPill,
    backgroundColor: tokens.accentStrong,
    marginBottom: 22,
  },
  plans: { gap: 10, marginTop: 18 },
  features: {
    gap: 8,
    marginTop: 18,
    marginBottom: 14,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: tokens.line,
  },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureTick: {
    width: 16,
    height: 16,
    borderRadius: tokens.rPill,
    marginTop: 2,
    backgroundColor: tokens.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.5,
    letterSpacing: 13.5 * -0.005,
    color: tokens.fg,
  },
  finePrint: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 11 * 1.5,
    color: tokens.fgSubtle,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
});
