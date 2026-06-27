import { Button, Eyebrow, Field, fonts, Icon, Input, Wordmark } from '@pantry/design-system/native';
import { tokens } from '@pantry/design-system/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { authStrings } from '../strings';
import { useLogin } from '../useLogin';

const s = authStrings.login;

export function LoginForm() {
  const login = useLogin();
  return (
    <View style={styles.column}>
      <Wordmark size={22} />
      <View style={styles.body}>
        <Eyebrow style={styles.eyebrow}>{s.eyebrow}</Eyebrow>
        <Text style={styles.heading}>
          {s.heading.before}
          {'\n'}
          <Text style={styles.headingEm}>{s.heading.em}</Text>
        </Text>
        <Text style={styles.lede}>{s.lede}</Text>
        <View style={styles.fields}>
          <Field
            label={s.emailLabel}
            {...(login.error === undefined ? {} : { error: login.error })}
          >
            <Input
              value={login.email}
              onChangeText={login.setEmail}
              keyboardType="email-address"
              testID="login-email"
              leftIcon={<Icon name="AtSign" size={15} color={tokens.fgSubtle} />}
            />
          </Field>
          <Field label={s.passwordLabel}>
            <Input
              value={login.password}
              onChangeText={login.setPassword}
              secureTextEntry
              testID="login-password"
              leftIcon={<Icon name="Lock" size={15} color={tokens.fgSubtle} />}
            />
          </Field>
          <Pressable testID="login-forgot" onPress={() => void login.forgot()} disabled={login.pending}>
            <Text style={styles.forgot}>{s.forgotPassword}</Text>
          </Pressable>
          {login.notice !== undefined && <Text style={styles.notice}>{login.notice}</Text>}
          <Button
            testID="login-submit"
            kind="primary"
            size="lg"
            full
            disabled={login.pending}
            onPress={() => void login.submit()}
            style={styles.submit}
          >
            {s.submit}
          </Button>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{s.divider}</Text>
            <View style={styles.dividerLine} />
          </View>
          <Button
            kind="secondary"
            full
            leftIcon={<Icon name="Apple" size={15} />}
            onPress={() => void login.oauth('apple')}
          >
            {s.oauthApple}
          </Button>
          <Button
            kind="secondary"
            full
            leftIcon={<Icon name="Chrome" size={15} />}
            onPress={() => void login.oauth('google')}
          >
            {s.oauthGoogle}
          </Button>
        </View>
      </View>
      {/* Mobile sign-up is not in M1 (no board frame) — footer is informational. */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {s.footerPrompt} <Text style={styles.footerCta}>{s.footerCta}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1 },
  body: { flex: 1, marginTop: 60 },
  eyebrow: { marginBottom: 16 },
  heading: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: 44 * -0.025,
    color: tokens.fg,
    marginBottom: 14,
  },
  headingEm: { fontFamily: fonts.displayItalic, fontStyle: 'italic', color: tokens.accent },
  lede: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 15 * 1.5,
    letterSpacing: 15 * -0.005,
    color: tokens.fgMuted,
    marginBottom: 28,
  },
  fields: { gap: 12 },
  forgot: {
    textAlign: 'right',
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: tokens.accent,
    marginTop: -2,
  },
  notice: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: tokens.accent, marginTop: 2 },
  submit: { marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: tokens.line },
  dividerText: { fontFamily: fonts.sans, fontSize: 12, color: tokens.fgSubtle },
  footer: { paddingTop: 24, paddingBottom: 40, alignItems: 'center' },
  footerText: { fontFamily: fonts.sans, fontSize: 13, color: tokens.fgSubtle },
  footerCta: { color: tokens.accent, fontWeight: '500' },
});
