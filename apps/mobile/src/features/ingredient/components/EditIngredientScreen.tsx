import type { PantryItem } from '@pantry/contracts';
import { Button, Eyebrow, Icon, Input, Pill, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { freshnessFor, freshnessLabel } from '@pantry/utils';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BestBySheet } from '../sheets/BestBySheet';
import { CategorySheet } from '../sheets/CategorySheet';
import { LocationSheet } from '../sheets/LocationSheet';
import { formStrings } from '../strings';
import { useIngredientForm } from '../useIngredientForm';
import { IngredientDetails } from './IngredientDetails';
import { IngredientHeader } from './IngredientHeader';

export interface EditIngredientScreenProps {
  item: PantryItem;
}

const BAR_MAX_DAYS = 30;

export function EditIngredientScreen({ item }: EditIngredientScreenProps) {
  const form = useIngredientForm(item);
  const { values, setField } = form;

  const handleSave = (): void => {
    void form.save();
  };
  const handleRemove = (): void => {
    void form.remove();
  };

  const freshness = freshnessFor(values.bestBy);
  const barFraction =
    freshness.daysLeft === null
      ? 1
      : Math.max(0.04, Math.min(1, freshness.daysLeft / BAR_MAX_DAYS));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <IngredientHeader title={formStrings.editTitle} onClose={form.cancel} onSave={handleSave} />

      <View style={styles.titleCard}>
        <Eyebrow style={styles.titleEyebrow}>{formStrings.ingredient}</Eyebrow>
        <Input
          value={values.name}
          onChangeText={(text) => {
            setField('name', text);
          }}
          style={styles.nameInput}
        />
        <Text style={styles.freshnessLabel}>{freshnessLabel(freshness)}</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { flex: barFraction }]} />
          <View style={{ flex: 1 - barFraction }} />
        </View>
      </View>

      <Eyebrow style={styles.sectionEyebrow}>{formStrings.details}</Eyebrow>
      <IngredientDetails
        quantity={values.quantity}
        unit={values.unit}
        category={values.category}
        location={values.location}
        onIncQuantity={form.incQuantity}
        onDecQuantity={form.decQuantity}
        onSelectUnit={(unit) => {
          setField('unit', unit);
        }}
        onOpenCategory={form.openCategory}
        onOpenLocation={form.openLocation}
      />

      <Eyebrow style={styles.sectionEyebrowSpaced}>{formStrings.freshness}</Eyebrow>
      <View style={styles.card}>
        <Pressable style={[styles.row, styles.bordered]} onPress={form.openBestBy}>
          <Text style={styles.rowLabel}>{formStrings.bestBy}</Text>
          <View style={styles.valueWrap}>
            <Text style={styles.monoValue}>{values.bestBy ?? formStrings.noBestBy}</Text>
            <Icon name="ChevronRight" size={14} color={tokens.fgSubtle} />
          </View>
        </Pressable>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{formStrings.freshness}</Text>
          <Pill tone="success">{formStrings.autoDetected}</Pill>
        </View>
      </View>

      <Eyebrow style={styles.sectionEyebrowSpaced}>{formStrings.notes}</Eyebrow>
      <View style={styles.notesCard}>
        <Input
          value={values.notes}
          onChangeText={(text) => {
            setField('notes', text);
          }}
          style={styles.notesInput}
        />
      </View>

      <Eyebrow style={styles.sectionEyebrowSpaced}>{formStrings.useItIn}</Eyebrow>
      <View style={styles.card}>
        {formStrings.useItInRecipes.map((recipe, i, all) => (
          <View
            key={recipe}
            style={[styles.row, i < all.length - 1 ? styles.bordered : null]}
          >
            <Text style={styles.recipe}>{recipe}</Text>
            <Icon name="ChevronRight" size={14} color={tokens.fgSubtle} />
          </View>
        ))}
      </View>

      <Button
        kind="danger"
        full
        onPress={handleRemove}
        leftIcon={<Icon name="Trash2" size={14} color={tokens.danger} />}
        style={styles.remove}
      >
        {formStrings.remove}
      </Button>

      <CategorySheet
        open={form.categoryOpen}
        value={values.category}
        onSelect={(v) => {
          setField('category', v);
        }}
        onClose={form.closeCategory}
      />
      <LocationSheet
        open={form.locationOpen}
        value={values.location}
        onSelect={(v) => {
          setField('location', v);
        }}
        onClose={form.closeLocation}
      />
      <BestBySheet
        open={form.bestByOpen}
        value={values.bestBy}
        onSelect={(v) => {
          setField('bestBy', v);
        }}
        onClose={form.closeBestBy}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.bgSunk,
  },
  content: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleCard: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 14,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
    marginBottom: 14,
  },
  titleEyebrow: {
    marginBottom: 6,
  },
  nameInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 14,
  },
  freshnessLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: tokens.fgSubtle,
    textAlign: 'right',
    marginBottom: 6,
  },
  barTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 999,
    backgroundColor: tokens.bgSunk,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: tokens.accent,
  },
  sectionEyebrow: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionEyebrowSpaced: {
    marginTop: 14,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: tokens.line,
  },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.fgMuted,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monoValue: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: tokens.fg,
  },
  notesCard: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  notesInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  recipe: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: tokens.fg,
  },
  remove: {
    marginTop: 18,
  },
});
