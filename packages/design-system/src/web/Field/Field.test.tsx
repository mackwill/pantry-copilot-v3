import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field } from './Field.js';

describe('Field', () => {
  it('renders label and child control', () => {
    render(
      <Field label="Name">
        <input />
      </Field>,
    );
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByRole('textbox')).toBeDefined();
  });

  it('shows hint when no error', () => {
    render(
      <Field label="Name" hint="Required">
        <input />
      </Field>,
    );
    expect(screen.getByText('Required')).toBeDefined();
  });

  it('shows error instead of hint', () => {
    render(
      <Field label="Name" hint="Required" error="Too short">
        <input />
      </Field>,
    );
    expect(screen.getByText('Too short')).toBeDefined();
    expect(screen.queryByText('Required')).toBeNull();
  });
});
