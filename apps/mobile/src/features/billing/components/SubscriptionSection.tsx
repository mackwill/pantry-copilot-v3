import type { SubscriptionState } from '@pantry/contracts';
import { Button, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, Text, View } from 'react-native';
import { billingStrings } from '../strings.js';

const strings = billingStrings.subscription;

/** Entitlement-derived display state for the settings card. */
export type SubscriptionDisplayState = 'free' | 'trial' | 'pro';

/** Free → upsell, trial → countdown + manage, pro → status + manage. */
export function deriveDisplayState(subscription: SubscriptionState): SubscriptionDisplayState {
  if (!subscription.isPro) return 'free';
  if (subscription.periodType === 'trial') return 'trial';
  return 'pro';
}

interface CardConfig {
  eyebrow: string;
  title: string;
  blurb: string;
  meta: string;
  cta: string;
  primary: boolean;
}

const CONFIG: Record<SubscriptionDisplayState, CardConfig> = {
  free: {
    eyebrow: strings.freeEyebrow,
    title: strings.freeTitle,
    blurb: strings.freeBlurb,
    meta: strings.freeMeta,
    cta: strings.freeCta,
    primary: true,
  },
  trial: {
    eyebrow: strings.trialEyebrow,
    title: strings.trialTitle,
    blurb: strings.trialBlurb,
    meta: strings.trialMeta,
    cta: strings.trialCta,
    primary: false,
  },
  pro: {
    eyebrow: strings.proEyebrow,
    title: strings.proTitle,
    blurb: strings.proBlurb,
    meta: strings.proMeta,
    cta: strings.proCta,
    primary: false,
  },
};

export interface SubscriptionSectionProps {
  subscription: SubscriptionState;
  /** Free → paywall trial; trial/pro → manage subscription. */
  onUpgrade: () => void;
  onManage: () => void;
}

/** Settings subscription status card — board `subscription` frames 11–12–13. */
export function SubscriptionSection({ subscription, onUpgrade, onManage }: SubscriptionSectionProps) {
  const state = deriveDisplayState(subscription);
  const cfg = CONFIG[state];
  const isPro = state === 'pro';
  const isTrial = state === 'trial';
  const onPress = state === 'free' ? onUpgrade : onManage;

  return (
    <View testID={`subscription-section-${state}`} style={styles.wrapper}>
      <Eyebrow style={styles.sectionEyebrow}>{strings.sectionEyebrow}</Eyebrow>
      <View style={[styles.card, isPro ? styles.cardPro : null]}>
        {isPro ? <View style={styles.proAccent} /> : null}
        <View style={styles.eyebrowRow}>
          <View
            style={[
              styles.eyebrowDot,
              isPro ? styles.eyebrowDotPro : isTrial ? styles.eyebrowDotTrial : null,
            ]}
          />
          <Text style={[styles.eyebrowText, isPro ? styles.textProAccent : isTrial ? styles.textTrial : styles.textMuted]}>
            {cfg.eyebrow}
          </Text>
        </View>
        <Text style={[styles.title, isPro ? styles.textPro : null]}>{cfg.title}</Text>
        <Text style={[styles.blurb, isPro ? styles.textProSub : styles.textMuted]}>{cfg.blurb}</Text>
        <Text style={[styles.meta, isPro ? styles.textProSub : styles.textSubtle]}>{cfg.meta}</Text>
        <Button
          testID="subscription-section-cta"
          kind={cfg.primary ? 'primary' : 'secondary'}
          size="md"
          style={styles.cta}
          onPress={onPress}
          leftIcon={cfg.primary ? <Icon name="Sparkles" size={14} color={tokens.accentFg} /> : undefined}
        >
          {cfg.cta}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  sectionEyebrow: { marginBottom: 8, paddingLeft: 4 },
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rLg,
    paddingVertical: 20,
    paddingHorizontal: 22,
    overflow: 'hidden',
  },
  cardPro: { backgroundColor: tokens.bgInverse, borderColor: tokens.bgInverse },
  proAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: tokens.accent },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  eyebrowDot: { width: 6, height: 6, borderRadius: tokens.rPill, backgroundColor: tokens.accent },
  eyebrowDotPro: { backgroundColor: tokens.accent },
  eyebrowDotTrial: { backgroundColor: tokens.warning },
  eyebrowText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 10 * 0.14,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: 28 * -0.025,
    color: tokens.fg,
    marginBottom: 8,
  },
  blurb: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 13.5 * 1.5, letterSpacing: 13.5 * -0.005 },
  meta: { fontFamily: fonts.mono, fontSize: 11, marginTop: 10 },
  cta: { marginTop: 16, alignSelf: 'flex-start' },
  textMuted: { color: tokens.fgMuted },
  textSubtle: { color: tokens.fgSubtle },
  textTrial: { color: tokens.warning },
  textPro: { color: tokens.bg },
  textProAccent: { color: tokens.accent },
  textProSub: { color: tokens.bgRaised },
});
