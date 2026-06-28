import { Button, Field, Icon, Input, fonts } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authClient } from '../../../lib/auth-client';
import { accountStrings } from '../strings';

const s = accountStrings.profile;

export interface ProfileEditScreenProps {
  name: string;
  email: string;
}

export function ProfileEditScreen({ name: initialName, email }: ProfileEditScreenProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);

  const save = (): void => {
    void authClient
      .updateUser({ name })
      .then(() => {
        setSaved(true);
      })
      .catch(() => undefined);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable testID="profile-back" onPress={() => { router.back(); }} hitSlop={8}>
            <Icon name="ChevronLeft" size={22} color={tokens.fg} />
          </Pressable>
        </View>
        <Text style={styles.title}>{s.title}</Text>

        <Field label={s.nameLabel}>
          <Input
            testID="profile-name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setSaved(false);
            }}
          />
        </Field>
        <Field label={s.emailLabel}>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.hint}>{s.emailHint}</Text>
        </Field>
      </ScrollView>
      <View style={styles.footer}>
        <Button testID="profile-save" kind="primary" full size="lg" onPress={save}>
          {saved ? s.saved : s.save}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bgSunk, paddingTop: 54 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { fontFamily: fonts.display, fontSize: 32, color: tokens.fg, marginBottom: 18 },
  email: { fontFamily: fonts.sans, fontSize: 15, color: tokens.fgMuted, paddingVertical: 6 },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: tokens.fgSubtle },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, backgroundColor: tokens.bgSunk },
});
