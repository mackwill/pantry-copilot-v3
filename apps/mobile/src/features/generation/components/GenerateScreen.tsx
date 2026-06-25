import { Button, Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LimitHitSheet } from '../../billing/sheets/LimitHitSheet';
import { type GenerationSubscribe, useGeneration } from '../useGeneration';
import { generationStrings } from '../strings';
import { BranchGrid } from './BranchGrid';
import { CollapsedReasoningMobile } from './CollapsedReasoningMobile';
import { DraftingRecipeMobile } from './DraftingRecipeMobile';
import { OneRecipeCardMobile } from './OneRecipeCardMobile';
import { ThinkingPanelMobile } from './ThinkingPanelMobile';

const t = generationStrings.thinking;
const e = generationStrings.errors;

function secs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Wall-clock elapsed while the stream is open; freezes when it ends. */
function useElapsedMs(active: boolean): number {
  const [ms, setMs] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return undefined;
    startRef.current = Date.now();
    const id = setInterval(() => {
      if (startRef.current !== null) setMs(Date.now() - startRef.current);
    }, 100);
    return () => {
      clearInterval(id);
    };
  }, [active]);
  return ms;
}

export interface GenerateScreenProps {
  prompt: string;
  weirdness: number;
  pantryItemIds: string[];
  onClose: () => void;
  /** Navigate to the paywall when the weekly quota blocks a generation. */
  onUpgrade?: (() => void) | undefined;
  /** Injectable subscription for tests/fidelity; production uses the real tRPC subscription. */
  subscribe?: GenerationSubscribe | undefined;
}

/** §04/§02 — switches Thinking → Drafting → Result off the shared stream hook. */
export function GenerateScreen({ prompt, weirdness, pantryItemIds, onClose, onUpgrade, subscribe }: GenerateScreenProps) {
  const gen = useGeneration(subscribe === undefined ? undefined : { subscribe });
  const { start } = gen;
  const elapsedMs = useElapsedMs(gen.isStreaming);

  useEffect(() => {
    start({ prompt, pantryItemIds, weirdness });
  }, [start, prompt, weirdness, pantryItemIds]);

  const elapsed = secs(elapsedMs);
  const thoughtFor = secs(gen.thinkingMs);
  const retry = (): void => {
    start({ prompt, pantryItemIds, weirdness });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable testID="generate-close" onPress={onClose} hitSlop={8}>
            <Icon name="X" size={22} color={tokens.fgMuted} />
          </Pressable>
          <Text style={styles.streamMeta}>
            {gen.isStreaming ? t.streamElapsed(elapsed) : `stream · ${thoughtFor}`}
          </Text>
        </View>

        <Eyebrow style={styles.askLabel}>{t.yourAsk}</Eyebrow>
        <Text style={styles.ask}>{`“${prompt}”`}</Text>

        {(gen.status === 'idle' || gen.status === 'thinking') && (
          <View style={styles.block}>
            <ThinkingPanelMobile transcript={gen.transcript} toolCount={gen.tools.length} />
            <Button testID="generate-stop" kind="ghost" full size="sm" onPress={gen.stop} leftIcon={<Icon name="X" size={14} color={tokens.fgMuted} />}>
              {t.stop}
            </Button>
          </View>
        )}

        {gen.status === 'drafting' && (
          <View style={styles.block}>
            <CollapsedReasoningMobile elapsed={thoughtFor} toolCount={gen.tools.length} />
            {gen.recipe !== null ? <DraftingRecipeMobile recipe={gen.recipe} /> : null}
            <Button testID="generate-stop" kind="ghost" full size="sm" onPress={gen.stop} leftIcon={<Icon name="X" size={14} color={tokens.fgMuted} />}>
              {t.stop}
            </Button>
          </View>
        )}

        {gen.status === 'result' && gen.recipe !== null && (
          <View style={styles.block}>
            <CollapsedReasoningMobile elapsed={thoughtFor} toolCount={gen.tools.length} />
            <OneRecipeCardMobile recipe={gen.recipe} />
            <BranchGrid onBranch={gen.branch} />
          </View>
        )}

        {(gen.status === 'error' || (gen.status === 'aborted' && gen.recipe === null)) && (
          <View style={styles.errorBlock}>
            <Text style={styles.errorTitle}>{gen.status === 'aborted' ? e.aborted : e.title}</Text>
            {gen.error !== null ? <Text style={styles.errorMessage}>{gen.error.message}</Text> : null}
            <View style={styles.errorActions}>
              <Button kind="primary" full onPress={retry}>
                {e.retry}
              </Button>
              <Button kind="ghost" full onPress={onClose}>
                {e.backHome}
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
      <LimitHitSheet
        open={gen.limitReached}
        onClose={gen.dismissLimitReached}
        onUpgrade={() => {
          gen.dismissLimitReached();
          onUpgrade?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40, gap: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  streamMeta: { fontFamily: fonts.mono, fontSize: 11, color: tokens.fgSubtle },
  askLabel: { marginBottom: 8 },
  ask: { fontFamily: fonts.display, fontStyle: 'italic', fontSize: 22, lineHeight: 28, color: tokens.accent, marginBottom: 18 },
  block: { gap: 18 },
  errorBlock: { gap: 12, marginTop: 12 },
  errorTitle: { fontFamily: fonts.display, fontSize: 22, color: tokens.fg },
  errorMessage: { fontFamily: fonts.sans, fontSize: 14, color: tokens.fgMuted },
  errorActions: { gap: 8, marginTop: 8 },
});
