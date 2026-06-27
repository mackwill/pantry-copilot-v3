import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreferenceEditor } from './PreferenceEditor';

describe('PreferenceEditor', () => {
  it('toggles a standard option on and off', () => {
    const onChange = vi.fn();
    render(
      <PreferenceEditor heading="Diet" options={['keto', 'vegan']} value={[]} onChange={onChange} testId="diet" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Keto' }));
    expect(onChange).toHaveBeenCalledWith(['keto']);
  });

  it('removes an already-selected option when toggled', () => {
    const onChange = vi.fn();
    render(
      <PreferenceEditor heading="Diet" options={['keto', 'vegan']} value={['keto']} onChange={onChange} testId="diet" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Keto' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('adds a trimmed, lowercased custom tag', () => {
    const onChange = vi.fn();
    render(
      <PreferenceEditor heading="Allergies" options={['peanuts']} value={[]} onChange={onChange} testId="allergy" />,
    );
    fireEvent.change(screen.getByPlaceholderText(/Add your own/), { target: { value: '  Mango ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onChange).toHaveBeenCalledWith(['mango']);
  });

  it('renders custom tags not present in the standard options', () => {
    render(
      <PreferenceEditor heading="Diet" options={['keto']} value={['halal']} onChange={vi.fn()} testId="diet" />,
    );
    expect(screen.getByRole('button', { name: 'Halal' })).toBeTruthy();
  });
});
