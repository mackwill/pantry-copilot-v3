import { BottomSheet, Button, Icon, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { addDays } from '@pantry/utils';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BEST_BY_PRESETS } from '../bestByPresets';
import { sheetStrings } from '../strings';
import { MonthCalendar } from './MonthCalendar';

const s = sheetStrings.bestBy;
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Short "May 10" label for the confirm button; em dash when untracked. */
function shortDate(iso: string | null): string {
  if (iso === null) return '—';
  const d = new Date(`${iso}T00:00:00Z`);
  return `${SHORT_MONTHS[d.getUTCMonth()] ?? ''} ${String(d.getUTCDate())}`;
}

export interface BestBySheetProps {
  open: boolean;
  value: string | null;
  onSelect: (iso: string | null) => void;
  onClose: () => void;
}

/** Best-by picker — quick-pick presets, a month calendar, and a static smart hint. */
export function BestBySheet({ open, value, onSelect, onClose }: BestBySheetProps) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const presetIso = (days: number | null): string | null => (days === null ? null : addDays(todayKey, days));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow={s.eyebrow}
      title={s.title}
      footer={
        <View style={styles.footer}>
          <Button
            kind="secondary"
            full
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            {s.dontTrack}
          </Button>
          <Button kind="primary" full onPress={onClose}>
            {s.save(shortDate(value))}
          </Button>
        </View>
      }
    >
      <View style={styles.body}>
        <Text style={styles.sectionLabel}>{s.quickPick}</Text>
        <View style={styles.pills}>
          {BEST_BY_PRESETS.map((preset) => {
            const iso = presetIso(preset.days);
            const selected = iso === value;
            return (
              <Pressable
                key={preset.label}
                aria-label={preset.label}
                aria-pressed={selected}
                onPress={() => {
                  onSelect(iso);
                }}
              >
                <Pill tone={selected ? 'accent' : 'outline'}>{preset.label}</Pill>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>{s.orPickDate}</Text>
        <MonthCalendar value={value} today={today} onPick={onSelect} />

        <View style={styles.hint}>
          <Icon name="Sparkles" size={13} color={tokens.accent} />
          <Text style={styles.hintText}>
            {s.hintLead}
            <Text style={styles.hintAccent}>{s.hintDays}</Text>
            {s.hintTail}
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  footer: { flexDirection: 'row', gap: 8 },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.fgSubtle,
    marginBottom: 10,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 22 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: tokens.accentSoft,
    borderRadius: tokens.rMd,
  },
  hintText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: tokens.fg },
  hintAccent: { color: tokens.accent, fontWeight: '600' },
});
