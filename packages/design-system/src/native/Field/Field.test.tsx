import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Text } from 'react-native';
import { Field } from './Field.js';

describe('Field (native)', () => {
  it('renders the label above its child control', () => {
    render(
      <Field label="Email">
        <Text>control</Text>
      </Field>,
    );
    // Read all properties off one declaration — jsdom recomputes (wrongly)
    // on a second getComputedStyle call against the same element.
    const label = getComputedStyle(screen.getByText('Email'));
    expect(label.color).toBe('rgb(84, 89, 85)');
    expect(label.fontSize).toBe('12px');
    expect(screen.getByText('control')).toBeTruthy();
  });

  it('shows the hint when there is no error', () => {
    render(
      <Field label="Email" hint="We never share it">
        <Text>control</Text>
      </Field>,
    );
    expect(getComputedStyle(screen.getByText('We never share it')).color).toBe(
      'rgb(138, 143, 136)',
    );
  });

  it('error wins over hint', () => {
    render(
      <Field label="Email" hint="We never share it" error="Required">
        <Text>control</Text>
      </Field>,
    );
    expect(screen.queryByText('We never share it')).toBeNull();
    expect(getComputedStyle(screen.getByText('Required')).color).toBe('rgb(168, 51, 30)');
  });
});
