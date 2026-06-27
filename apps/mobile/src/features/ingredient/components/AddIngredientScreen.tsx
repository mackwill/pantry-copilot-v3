import { Button, Eyebrow, Icon, Input, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BestBySheet } from '../sheets/BestBySheet';
import { CategorySheet } from '../sheets/CategorySheet';
import { LocationSheet } from '../sheets/LocationSheet';
import { formStrings } from '../strings';
import { useIngredientForm } from '../useIngredientForm';
import { IngredientDetails } from './IngredientDetails';
import { IngredientHeader } from './IngredientHeader';
import { QuickActions } from './QuickActions';
import { SuggestionPills } from './SuggestionPills';

export function AddIngredientScreen() {
  const form = useIngredientForm();
  const router = useRouter();
  const { values, setField } = form;

  const handleSave = (): void => {
    void form.save();
  };
  const handleSaveAndAnother = (): void => {
    void form.saveAndAnother();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <IngredientHeader title={formStrings.addTitle} onClose={form.cancel} onSave={handleSave} />

      <QuickActions onScan={() => { router.push('/scan'); }} />

      <Eyebrow style={styles.sectionEyebrow}>{formStrings.manually}</Eyebrow>
      <View style={styles.nameCard}>
        <Eyebrow style={styles.nameEyebrow}>{formStrings.whatIsIt}</Eyebrow>
        <Input
          testID="ingredient-name-input"
          value={values.name}
          onChangeText={(text) => {
            setField('name', text);
          }}
          placeholder={formStrings.namePlaceholder}
          style={styles.nameInput}
        />
        <SuggestionPills
          suggestions={formStrings.nameSuggestions}
          onPick={(name) => {
            setField('name', name);
          }}
        />
      </View>

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

      <Eyebrow style={styles.sectionEyebrow}>{formStrings.bestBy}</Eyebrow>
      <Pressable style={styles.bestByCard} onPress={form.openBestBy}>
        <Text style={styles.bestByValue}>{values.bestBy ?? formStrings.noBestBy}</Text>
        <Icon name="ChevronRight" size={14} color={tokens.fgSubtle} />
      </Pressable>

      <Button
        kind="primary"
        full
        size="lg"
        testID="add-to-pantry"
        leftIcon={<Icon name="Plus" size={16} color={tokens.accentFg} />}
        onPress={handleSave}
        style={styles.primary}
      >
        {formStrings.addToPantry}
      </Button>
      <Button kind="ghost" full onPress={handleSaveAndAnother} style={styles.ghost}>
        {formStrings.addAnother}
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
  sectionEyebrow: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  nameCard: {
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 14,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 14,
    marginBottom: 14,
  },
  nameEyebrow: {
    marginBottom: 8,
  },
  nameInput: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  bestByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.bgRaised,
    borderWidth: 1,
    borderColor: tokens.line,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  bestByValue: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: tokens.fg,
  },
  primary: {
    marginTop: 6,
    marginBottom: 10,
  },
  ghost: {
    marginBottom: 4,
  },
});
