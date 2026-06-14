import { Icon, Eyebrow, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { pantryStrings } from '../strings';
import { useCookSelection } from '../useCookSelection';
import { usePantry } from '../usePantry';
import { CookTray } from './CookTray';
import { PantrySection } from './PantrySection';

const MAX_CHIPS = 3;

export function PantryScreen() {
  const { needsUsing, fresh, expiringCount, items } = usePantry();
  const selection = useCookSelection();

  const chipLabels = selection
    .selectedItems(items)
    .slice(0, MAX_CHIPS)
    .map((item) => item.name.toLowerCase());

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.eyebrowRow}>
            <Eyebrow>{pantryStrings.eyebrow}</Eyebrow>
            <View style={styles.icons}>
              <Icon name="Search" size={18} color={tokens.fgMuted} />
              <Icon name="SlidersHorizontal" size={18} color={tokens.fgMuted} />
            </View>
          </View>
          <Text style={styles.title}>{pantryStrings.title}</Text>
          <Text style={styles.subtitle}>
            {pantryStrings.subtitleLead}
            <Text style={styles.subtitleCount}>{pantryStrings.expiringSuffix(expiringCount)}</Text>
          </Text>
        </View>

        <PantrySection
          title={pantryStrings.needsUsing}
          items={needsUsing}
          isSelected={selection.isSelected}
          onToggle={selection.toggle}
        />
        <PantrySection
          title={pantryStrings.fresh}
          items={fresh}
          isSelected={selection.isSelected}
          onToggle={selection.toggle}
        />
      </ScrollView>

      {selection.count > 0 ? (
        <CookTray
          count={selection.count}
          chipLabels={chipLabels}
          onCook={() => {
            /* M4 wires generation; no-op stub this milestone. */
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bg,
    paddingTop: 54,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 130,
    gap: 24,
  },
  header: {
    gap: 10,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icons: {
    flexDirection: 'row',
    gap: 16,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: tokens.fg,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: tokens.fgMuted,
  },
  subtitleCount: {
    color: tokens.warning,
  },
});
