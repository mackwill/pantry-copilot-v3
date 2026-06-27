import type { PantryItem } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('expo-router', () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

const selected = [
  { id: 'a', name: 'Whole milk' },
  { id: 'b', name: 'Carrots' },
] as unknown as PantryItem[];

vi.mock('../useCookSelection', () => ({
  useCookSelection: () => ({
    count: 2,
    isSelected: () => false,
    toggle: vi.fn(),
    selectedItems: () => selected,
  }),
}));

vi.mock('../usePantry', () => ({
  usePantry: () => ({ items: selected, needsUsing: [], fresh: [], expiringCount: 0 }),
}));

import { PantryScreen } from './PantryScreen';

describe('PantryScreen cook tray', () => {
  it('navigates to generation with the selected pantry item ids when Cook is pressed', () => {
    render(<PantryScreen />);
    fireEvent.click(screen.getByTestId('cook-button'));
    expect(push).toHaveBeenCalledWith({ pathname: '/generate', params: { items: 'a,b' } });
  });
});
