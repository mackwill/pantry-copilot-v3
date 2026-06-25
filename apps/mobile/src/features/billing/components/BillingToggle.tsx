import { fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { billingStrings } from '../strings.js';

export interface BillingToggleProps {
  annual: boolean;
  onChange: (annual: boolean) => void;
}

const strings = billingStrings.toggle;

/** Segmented monthly/annual control (board `paywall-a`/`paywall-b` · BillingToggle). */
export function BillingToggle({ annual, onChange }: BillingToggleProps) {
  return (
    <View style={styles.track}>
      <Pressable
        testID="billing-toggle-monthly"
        onPress={() => {
          onChange(false);
        }}
        style={[styles.segment, annual ? styles.segmentIdle : styles.segmentOn]}
      >
        <Text style={[styles.label, annual ? styles.labelIdle : styles.labelOn]}>
          {strings.monthly}
        </Text>
      </Pressable>
      <Pressable
        testID="billing-toggle-annual"
        onPress={() => {
          onChange(true);
        }}
        style={[styles.segment, annual ? styles.segmentOn : styles.segmentIdle]}
      >
        <Text style={[styles.label, annual ? styles.labelOn : styles.labelIdle]}>
          {strings.annual}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 4,
    padding: 4,
    backgroundColor: tokens.bgSunk,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rPill,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: tokens.rPill,
    borderWidth: 1,
  },
  segmentOn: {
    backgroundColor: tokens.bg,
    borderColor: tokens.line,
  },
  segmentIdle: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 13 * -0.005,
  },
  labelOn: {
    color: tokens.fg,
  },
  labelIdle: {
    color: tokens.fgMuted,
  },
});
