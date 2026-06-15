import type { BranchAction } from '@pantry/contracts';
import { Eyebrow, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BRANCH_TILES, generationStrings } from '../strings';

/** §02 branch tiles — four one-tap re-prompts in a 2×2 grid. */
export function BranchGrid({ onBranch }: { onBranch: (action: BranchAction) => void }) {
  return (
    <View style={styles.wrap}>
      <Eyebrow style={styles.eyebrow}>{generationStrings.branches.eyebrow}</Eyebrow>
      <View style={styles.grid}>
        {BRANCH_TILES.map((tile) => (
          <Pressable
            key={tile.action}
            testID={`branch-${tile.action}`}
            onPress={() => {
              onBranch(tile.action);
            }}
            style={styles.tile}
          >
            <Icon name={tile.icon} size={14} color={tokens.accent} />
            <Text style={styles.label}>{tile.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  eyebrow: { marginBottom: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 10,
    backgroundColor: tokens.bgRaised,
  },
  label: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.fg },
});
