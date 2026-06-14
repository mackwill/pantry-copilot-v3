import { Button, Eyebrow, fonts, Icon } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { authClient } from '../../../lib/auth-client';
import { accountStrings } from '../strings';
import { AccountStatsCard } from './AccountStatsCard';
import { SettingsSection } from './SettingsSection';

export interface AccountScreenProps {
  user: { name: string; email: string };
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function AccountScreen({ user }: AccountScreenProps) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Eyebrow style={styles.screenEyebrow}>{accountStrings.eyebrow}</Eyebrow>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(user.name)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        <Icon name="ChevronRight" size={18} color={tokens.fgSubtle} />
      </View>

      <AccountStatsCard />

      {accountStrings.sections.map((section) => (
        <SettingsSection
          key={section.title}
          title={section.title}
          rows={section.rows}
        />
      ))}

      <Button
        kind="danger"
        full
        style={styles.signOutButton}
        onPress={() => {
          void authClient.signOut();
        }}
      >
        {accountStrings.signOut}
      </Button>

      <Text style={styles.version}>{accountStrings.version}</Text>
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
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  screenEyebrow: {
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.bgInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: tokens.bg,
    letterSpacing: 20 * -0.025,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '600',
    color: tokens.fg,
    marginBottom: 2,
  },
  profileEmail: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: tokens.fgMuted,
  },
  signOutButton: {
    marginBottom: 16,
  },
  version: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: tokens.fgSubtle,
    textAlign: 'center',
  },
});
