import { Button, Eyebrow, Icon, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { UseScanFlow } from '../useScanFlow';
import { scanStrings } from '../strings';
import { ReviewRow } from './ReviewRow';

interface ReviewStepProps {
  flow: UseScanFlow;
}

export function ReviewStep({ flow }: ReviewStepProps) {
  const { rows, selectedCount } = flow;
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Icon name="ChevronLeft" size={22} color={tokens.fg} />
          <Pill tone="success">{scanStrings.review.complete}</Pill>
          <Icon name="RefreshCw" size={18} color={tokens.fgMuted} />
        </View>

        <Eyebrow>{scanStrings.review.eyebrow}</Eyebrow>
        <Text style={styles.title}>
          {scanStrings.review.titleLead}
          <Text style={styles.titleAccent}>{scanStrings.review.titleCount(selectedCount)}</Text>
          {scanStrings.review.titleTrail(selectedCount)}
        </Text>
        <Text style={styles.subtitle}>{scanStrings.review.subtitle}</Text>

        <View style={styles.list}>
          {rows.map((row, i) => (
            <ReviewRow
              key={row.id}
              row={row}
              isLast={i === rows.length - 1}
              onToggle={flow.toggle}
              onEdit={() => { /* Inline edit sheet is a follow-up; affordance shown per board §08. */ }}
            />
          ))}
        </View>

        <Button kind="ghost" full onPress={flow.addMissing} leftIcon={<Icon name="Plus" size={14} color={tokens.accent} />}>
          {scanStrings.review.addMissing}
        </Button>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          testID="scan-confirm"
          kind="primary"
          size="lg"
          full
          onPress={flow.confirm}
          leftIcon={<Icon name="Refrigerator" size={16} color={tokens.accentFg} />}
        >
          {scanStrings.review.addToPantry(selectedCount)}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.bgSunk, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontFamily: fonts.display, fontSize: 34, color: tokens.fg },
  titleAccent: { color: tokens.accent, fontStyle: 'italic' },
  subtitle: { fontSize: 13, color: tokens.fgMuted, marginBottom: 8 },
  list: { backgroundColor: tokens.bgRaised, borderWidth: 1, borderColor: tokens.line, borderRadius: 14, overflow: 'hidden' },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, backgroundColor: tokens.bgSunk },
});
