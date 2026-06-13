import { MobileTabBar, type MobileTabBarItem } from '@pantry/design-system/native';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { shellStrings } from './strings';

// The tab bar is asserted directly on react-native-web; expo-router's native
// Tabs component is exercised on the simulator, not in jsdom.
const items: MobileTabBarItem[] = [
  { id: 'index', label: shellStrings.tabs.home, icon: 'House' },
  { id: 'pantry', label: shellStrings.tabs.pantry, icon: 'Refrigerator' },
  { id: 'cook', label: shellStrings.tabs.cook, icon: 'ChefHat' },
  { id: 'scan', label: shellStrings.tabs.scan, icon: 'ScanLine' },
  { id: 'me', label: shellStrings.tabs.me, icon: 'User' },
];

describe('tabs layout bar', () => {
  it('shows the five shell tab labels', () => {
    render(<MobileTabBar items={items} active="index" />);
    for (const label of Object.values(shellStrings.tabs)) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('marks the active tab selected', () => {
    render(<MobileTabBar items={items} active="cook" />);
    const tabs = screen.getAllByRole('tab');
    const selected = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]?.textContent).toBe(shellStrings.tabs.cook);
  });
});
