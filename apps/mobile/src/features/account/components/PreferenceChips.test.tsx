import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreferenceChips } from './PreferenceChips';

describe('PreferenceChips (mobile)', () => {
  it('toggles a standard option on', () => {
    const onChange = vi.fn();
    render(
      <PreferenceChips testID="diet" heading="Diet" options={['keto', 'vegan']} value={[]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('diet-chip-keto'));
    expect(onChange).toHaveBeenCalledWith(['keto']);
  });

  it('removes an already-selected option', () => {
    const onChange = vi.fn();
    render(
      <PreferenceChips testID="diet" heading="Diet" options={['keto']} value={['keto']} onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('diet-chip-keto'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('adds a trimmed, lowercased custom tag', () => {
    const onChange = vi.fn();
    render(
      <PreferenceChips testID="allergy" heading="Allergies" options={['peanuts']} value={[]} onChange={onChange} />,
    );
    fireEvent.change(screen.getByTestId('allergy-custom-input'), { target: { value: '  Mango ' } });
    fireEvent.click(screen.getByText('Add'));
    expect(onChange).toHaveBeenCalledWith(['mango']);
  });
});
