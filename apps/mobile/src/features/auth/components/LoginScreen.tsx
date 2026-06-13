import { tokens } from '@pantry/design-system/tokens';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LoginForm } from './LoginForm';

export function LoginScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <LoginForm />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.bg, paddingTop: 54 },
  content: { paddingTop: 40, paddingHorizontal: 24, flexGrow: 1 },
});
