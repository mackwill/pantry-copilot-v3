import { Eyebrow } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { StyleSheet, View } from 'react-native';
import { accountStrings } from '../strings';
import { SettingsRow } from './SettingsRow';

export interface SettingsSectionProps {
  title: string;
  rows: readonly (readonly [string, string])[];
  /** Per-row press handlers keyed by row label; rows without an entry are inert. */
  rowHandlers?: Record<string, () => void>;
}

export function SettingsSection({ title, rows, rowHandlers }: SettingsSectionProps) {
  return (
    <View style={styles.wrapper}>
      <Eyebrow style={styles.eyebrow}>{title}</Eyebrow>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <SettingsRow
            key={row[0]}
            label={row[0]}
            value={row[1]}
            last={index === rows.length - 1}
            weirdnessValue={row[0] === accountStrings.weirdnessLabel}
            onPress={rowHandlers?.[row[0]]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  eyebrow: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rLg,
    overflow: 'hidden',
  },
});
