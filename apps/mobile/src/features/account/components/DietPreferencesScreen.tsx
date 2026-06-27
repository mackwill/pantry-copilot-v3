import { ALLERGY_OPTIONS, DIET_OPTIONS } from '@pantry/contracts';
import { Button, Icon, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../../lib/api';
import { accountStrings } from '../strings';
import { PreferenceChips } from './PreferenceChips';

const s = accountStrings.diet;

export function DietPreferencesScreen() {
  const router = useRouter();
  const [diet, setDiet] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void api.user.preferences
      .query()
      .then((prefs) => {
        if (!active) return;
        setDiet(prefs.diet);
        setAllergies(prefs.allergies);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const save = (): void => {
    void api.user.updatePreferences
      .mutate({ diet, allergies })
      .then(() => {
        setSaved(true);
      })
      .catch(() => undefined);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable testID="diet-back" onPress={() => { router.back(); }} hitSlop={8}>
            <Icon name="ChevronLeft" size={22} color={tokens.fg} />
          </Pressable>
        </View>
        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.subtitle}>{s.subtitle}</Text>

        <PreferenceChips
          testID="diet-chips"
          heading={s.dietHeading}
          options={DIET_OPTIONS}
          value={diet}
          onChange={(next) => {
            setDiet(next);
            setSaved(false);
          }}
        />
        <PreferenceChips
          testID="allergy-chips"
          heading={s.allergyHeading}
          options={ALLERGY_OPTIONS}
          value={allergies}
          onChange={(next) => {
            setAllergies(next);
            setSaved(false);
          }}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button testID="diet-save" kind="primary" full size="lg" onPress={save}>
          {saved ? s.saved : s.save}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bgSunk, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { fontFamily: fonts.display, fontSize: 32, color: tokens.fg, marginBottom: 6 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: tokens.fgMuted, marginBottom: 22 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, backgroundColor: tokens.bgSunk },
});
