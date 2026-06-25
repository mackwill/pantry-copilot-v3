import { useLocalSearchParams, useRouter } from 'expo-router';
import { GenerateScreen } from '../../features/generation/components/GenerateScreen';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prompt?: string; weirdness?: string; items?: string }>();
  const prompt = firstParam(params.prompt);
  const weirdness = Number.parseInt(firstParam(params.weirdness), 10);
  const items = firstParam(params.items)
    .split(',')
    .filter((id) => id.length > 0);

  return (
    <GenerateScreen
      prompt={prompt}
      weirdness={Number.isNaN(weirdness) ? 38 : weirdness}
      pantryItemIds={items}
      onClose={() => {
        router.back();
      }}
      onUpgrade={() => {
        router.push('/(billing)/paywall');
      }}
    />
  );
}
