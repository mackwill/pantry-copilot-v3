import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { monthGrid } from '@pantry/utils';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { sheetStrings } from '../strings';

const s = sheetStrings.bestBy;
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function isoOf(year: number, monthIndex: number, day: number): string {
  const mm = String(monthIndex + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${String(year)}-${mm}-${dd}`;
}

export interface MonthCalendarProps {
  /** Currently selected ISO date (yyyy-mm-dd), or null when untracked. */
  value: string | null;
  today: Date;
  onPick: (iso: string) => void;
}

/** Month calendar card with chevron nav, weekday header, and a 7-col day grid. */
export function MonthCalendar({ value, today, onPick }: MonthCalendarProps) {
  const initial = value === null ? today : new Date(`${value}T00:00:00Z`);
  const [view, setView] = useState({
    year: initial.getUTCFullYear(),
    month: initial.getUTCMonth(),
  });

  const cells = monthGrid(view.year, view.month);
  const todayIso = isoOf(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  function step(delta: number): void {
    setView((prev) => {
      const next = new Date(Date.UTC(prev.year, prev.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.nav}>
        <Pressable aria-label="Previous month" onPress={() => { step(-1); }}>
          <Icon name="ChevronLeft" size={18} color={tokens.fgMuted} />
        </Pressable>
        <Text style={styles.monthLabel}>{`${MONTH_NAMES[view.month] ?? ''} ${String(view.year)}`}</Text>
        <Pressable aria-label="Next month" onPress={() => { step(1); }}>
          <Icon name="ChevronRight" size={18} color={tokens.fgMuted} />
        </Pressable>
      </View>
      <View style={styles.weekdays}>
        {s.weekdays.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const iso = isoOf(view.year, view.month, day);
          const selected = iso === value;
          const isToday = iso === todayIso;
          return (
            <Pressable
              key={i}
              aria-label={iso}
              onPress={() => { onPick(iso); }}
              style={[
                styles.cell,
                styles.dayCell,
                selected ? styles.daySelected : isToday ? styles.dayToday : null,
              ]}
            >
              <Text style={[styles.dayText, selected ? styles.dayTextSelected : isToday ? styles.dayTextToday : null]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: tokens.rLg,
    padding: 14,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: { fontFamily: fonts.display, fontSize: 16, letterSpacing: -0.16, color: tokens.fg },
  weekdays: { flexDirection: 'row', marginBottom: 6 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.mono,
    fontSize: 11,
    color: tokens.fgSubtle,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.2857%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayCell: { borderRadius: tokens.rSm },
  daySelected: { backgroundColor: tokens.accent },
  dayToday: { borderWidth: 1, borderColor: tokens.accent, borderRadius: tokens.rSm },
  dayText: { fontFamily: fonts.mono, fontSize: 13, color: tokens.fg },
  dayTextSelected: { color: tokens.accentFg },
  dayTextToday: { color: tokens.accent },
});
