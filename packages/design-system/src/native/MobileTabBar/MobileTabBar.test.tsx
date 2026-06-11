import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MobileTabBar, type MobileTabBarItem } from './MobileTabBar.js';

const items: MobileTabBarItem[] = [
  { id: 'home', label: 'Home', icon: 'House' },
  { id: 'pantry', label: 'Pantry', icon: 'Refrigerator' },
  { id: 'cook', label: 'Cook', icon: 'ChefHat' },
  { id: 'scan', label: 'Scan', icon: 'ScanLine' },
  { id: 'me', label: 'Me', icon: 'User' },
];

describe('MobileTabBar (native)', () => {
  it('renders every tab label', () => {
    render(<MobileTabBar items={items} active="home" />);
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeTruthy();
    }
  });

  it('marks only the active tab as selected', () => {
    render(<MobileTabBar items={items} active="pantry" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    const selected = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]?.textContent).toContain('Pantry');
  });

  it('fires onPress with the tab id', () => {
    const onPress = vi.fn();
    render(<MobileTabBar items={items} active="home" onPress={onPress} />);
    fireEvent.click(screen.getByText('Cook'));
    expect(onPress).toHaveBeenCalledWith('cook');
  });
});
