import interVariable from '@pantry/design-system/fonts/Inter-Variable.woff2';
import jetbrainsMonoVariable from '@pantry/design-system/fonts/JetBrainsMono-Variable.woff2';
import newsreaderItalic from '@pantry/design-system/fonts/Newsreader-Italic.woff2';
import newsreaderVariable from '@pantry/design-system/fonts/Newsreader-Variable.woff2';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useAuthGate } from '../lib/useAuthGate';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Newsreader: newsreaderVariable,
    'Newsreader-Italic': newsreaderItalic,
    Inter: interVariable,
    'JetBrains Mono': jetbrainsMonoVariable,
  });
  useAuthGate();
  if (fontError) throw fontError;
  if (!fontsLoaded) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
