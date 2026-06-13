import { MobileTabBar, type MobileTabBarItem } from '@pantry/design-system/native';
import { Tabs } from 'expo-router';
import { shellStrings } from '../../features/shell/strings';

const items: MobileTabBarItem[] = [
  { id: 'index', label: shellStrings.tabs.home, icon: 'House' },
  { id: 'pantry', label: shellStrings.tabs.pantry, icon: 'Refrigerator' },
  { id: 'cook', label: shellStrings.tabs.cook, icon: 'ChefHat' },
  { id: 'scan', label: shellStrings.tabs.scan, icon: 'ScanLine' },
  { id: 'me', label: shellStrings.tabs.me, icon: 'User' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <MobileTabBar
          items={items}
          active={state.routes[state.index]?.name ?? 'index'}
          onPress={(id) => {
            navigation.navigate(id);
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pantry" />
      <Tabs.Screen name="cook" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
