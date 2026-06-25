import { Icon, fonts } from '@pantry/design-system/native';
import type { PlanDef, PlanId } from '@pantry/contracts';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { billingStrings } from '../strings.js';

export interface PlanOptionProps {
  plan: PlanDef;
  /** When true, show the annual price; otherwise the monthly price. */
  annual: boolean;
  selected: boolean;
  /** Render the "Best value" badge + emphasised styling (Pro). */
  highlight?: boolean;
  onSelect: (planId: PlanId) => void;
}

const strings = billingStrings.planOption;

export function PlanOption({ plan, annual, selected, highlight = false, onSelect }: PlanOptionProps) {
  const price = annual ? plan.priceAnnual : plan.priceMonthly;
  const period = annual ? strings.perYear : strings.perMonth;
  const tagline = strings.tagline[plan.id];

  return (
    <Pressable
      testID={`plan-option-${plan.id}`}
      onPress={() => {
        onSelect(plan.id);
      }}
      style={[styles.card, selected ? styles.cardSelected : styles.cardIdle]}
    >
      {highlight ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{strings.popularBadge}</Text>
        </View>
      ) : null}
      <View style={styles.headerRow}>
        <View style={styles.nameGroup}>
          <View style={[styles.radio, selected ? styles.radioSelected : styles.radioIdle]}>
            {selected ? <Icon name="Check" size={10} color={tokens.accentFg} /> : null}
          </View>
          <Text style={[styles.name, selected ? styles.textOnSelected : styles.textIdle]}>
            {plan.name}
          </Text>
        </View>
        <View style={styles.priceGroup}>
          <Text style={[styles.price, selected ? styles.textOnSelected : styles.textIdle]}>
            {`$${String(price)}`}
          </Text>
          <Text style={[styles.period, selected ? styles.periodOnSelected : styles.periodIdle]}>
            {period}
          </Text>
        </View>
      </View>
      <Text style={[styles.tagline, selected ? styles.taglineOnSelected : styles.taglineIdle]}>
        {tagline}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tokens.rLg,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  cardIdle: {
    backgroundColor: tokens.bgRaised,
    borderColor: tokens.line,
  },
  cardSelected: {
    backgroundColor: tokens.bgInverse,
    borderColor: tokens.bgInverse,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 14,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: tokens.rPill,
    backgroundColor: tokens.accent,
  },
  badgeText: {
    fontFamily: fonts.sans,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 9 * 0.14,
    textTransform: 'uppercase',
    color: tokens.accentFg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: tokens.rPill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioIdle: {
    borderColor: tokens.lineStrong,
    backgroundColor: 'transparent',
  },
  radioSelected: {
    borderColor: tokens.accentStrong,
    backgroundColor: tokens.accent,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 22 * -0.02,
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 20 * -0.02,
  },
  period: {
    fontFamily: fonts.sans,
    fontSize: 11,
    marginLeft: 4,
  },
  periodIdle: {
    color: tokens.fgSubtle,
  },
  periodOnSelected: {
    color: tokens.fgOnInverse,
    opacity: 0.55,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 12.5 * 1.4,
    marginTop: 8,
    paddingLeft: 28,
  },
  taglineIdle: {
    color: tokens.fgMuted,
  },
  taglineOnSelected: {
    color: tokens.fgOnInverse,
    opacity: 0.7,
  },
  textIdle: {
    color: tokens.fg,
  },
  textOnSelected: {
    color: tokens.fgOnInverse,
  },
});
