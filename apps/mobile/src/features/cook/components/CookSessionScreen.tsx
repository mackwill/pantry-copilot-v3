import { Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { cookStrings as s, formatTimer } from '../strings';
import type { UseCookSession } from '../useCookSession';
import { CookTimerRing } from './CookTimerRing';

export interface CookSessionScreenProps {
  recipeTitle: string;
  summary: string;
  caveat?: string | undefined;
  cook: UseCookSession;
  onExit: () => void;
  onFinish: () => void;
}

/** Board §03.5 mobile dark "stove" in-session screen. */
export function CookSessionScreen({ recipeTitle, summary, caveat, cook, onExit, onFinish }: CookSessionScreenProps) {
  const timed = cook.secondsRemaining !== null && cook.durationSeconds !== null;
  return (
    <View testID="cook-session" style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <Pressable testID="cook-exit" onPress={onExit} hitSlop={10}>
            <Icon name="X" size={20} color={tokens.stove.fgMuted} />
          </Pressable>
          <Text style={styles.topEyebrow}>{s.cooking}</Text>
          <View style={{ width: 20 }} />
        </View>

        <Text style={styles.recipeTitle} numberOfLines={1}>
          {recipeTitle}
        </Text>

        <View style={styles.segments}>
          {Array.from({ length: cook.totalSteps }, (_, i) => (
            <View
              key={i}
              style={[styles.segment, i <= cook.stepIndex ? styles.segmentOn : styles.segmentOff]}
            />
          ))}
          <Text style={styles.segmentLabel}>{s.stepOf(cook.stepIndex + 1, cook.totalSteps)}</Text>
        </View>

        <Text style={styles.stepEyebrow}>{s.stepLabel(cook.stepIndex + 1, cook.step?.label)}</Text>
        <Text style={styles.heading}>{cook.step?.text}</Text>
        {summary.length > 0 && <Text style={styles.blurb}>{summary}</Text>}

        <View style={styles.timerCard}>
          {timed ? (
            <CookTimerRing secondsRemaining={cook.secondsRemaining ?? 0} durationSeconds={cook.durationSeconds ?? 0} />
          ) : (
            <Text style={styles.untimed}>{s.untimed}</Text>
          )}
          {timed && (
            <View style={styles.timerMeta}>
              <Text style={styles.timerLabel}>{cook.step?.label ?? s.next}</Text>
              <Text style={styles.timerOf}>{formatTimer(cook.durationSeconds ?? 0)}</Text>
            </View>
          )}
        </View>

        {caveat !== undefined && (
          <View style={styles.warnChip}>
            <Icon name="TriangleAlert" size={14} color={tokens.stove.accent} />
            <Text style={styles.warnText}>{caveat}</Text>
          </View>
        )}

        {cook.nextStep !== undefined && (
          <View style={styles.upNext}>
            <Text style={styles.upNextEyebrow}>{s.upNext}</Text>
            <Text style={styles.upNextText}>{cook.nextStep.text}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.nav}>
        <Pressable
          testID="cook-prev"
          onPress={cook.goPrev}
          disabled={cook.isFirst}
          style={[styles.navBtn, styles.navBack, cook.isFirst && styles.navDisabled]}
        >
          <Icon name="ArrowLeft" size={16} color={tokens.fgOnInverse} />
          <Text style={styles.navBackText}>{s.back}</Text>
        </Pressable>
        {cook.isLast ? (
          <Pressable testID="cook-finish" onPress={onFinish} style={[styles.navBtn, styles.navNext]}>
            <Text style={styles.navNextText}>{s.finish}</Text>
            <Icon name="Check" size={16} color={tokens.stove.bg} />
          </Pressable>
        ) : (
          <Pressable testID="cook-next" onPress={cook.goNext} style={[styles.navBtn, styles.navNext]}>
            <Text style={styles.navNextText}>{s.next}</Text>
            <Icon name="ArrowRight" size={16} color={tokens.stove.bg} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.stove.bg, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  topEyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.stove.fgMuted,
  },
  recipeTitle: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 13, color: tokens.stove.fgMuted, marginBottom: 8 },
  segments: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 26 },
  segment: { flex: 1, height: 3, borderRadius: tokens.rPill },
  segmentOn: { backgroundColor: tokens.stove.accent },
  segmentOff: { backgroundColor: tokens.stove.line },
  segmentLabel: { marginLeft: 8, fontFamily: fonts.mono, fontSize: 10, color: tokens.stove.fgSubtle },
  stepEyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.stove.accent,
    marginBottom: 12,
  },
  heading: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42, letterSpacing: -0.9, color: tokens.fgOnInverse, marginBottom: 16 },
  blurb: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: tokens.stove.fgMuted, marginBottom: 24 },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: tokens.stove.bgRaised,
    borderWidth: 1,
    borderColor: tokens.stove.line,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  untimed: { fontFamily: fonts.sans, fontSize: 13, color: tokens.stove.fgMuted },
  timerMeta: { flex: 1 },
  timerLabel: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600', color: tokens.fgOnInverse, textTransform: 'capitalize' },
  timerOf: { fontFamily: fonts.mono, fontSize: 12, color: tokens.stove.fgSubtle, marginTop: 2 },
  warnChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: tokens.stove.accentSoft,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  warnText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: tokens.fgOnInverse },
  upNext: { borderTopWidth: 1, borderTopColor: tokens.stove.line, paddingTop: 14 },
  upNextEyebrow: {
    fontFamily: fonts.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: tokens.stove.fgSubtle,
    marginBottom: 6,
  },
  upNextText: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 15, lineHeight: 20, color: tokens.fgOnInverse },
  nav: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: tokens.stove.line,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 50, borderRadius: 12 },
  navBack: { flex: 1, backgroundColor: tokens.stove.bgRaised, borderWidth: 1, borderColor: tokens.stove.line },
  navBackText: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: tokens.fgOnInverse },
  navDisabled: { opacity: 0.4 },
  navNext: { flex: 2, backgroundColor: tokens.stove.accent },
  navNextText: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '600', color: tokens.stove.bg },
});
