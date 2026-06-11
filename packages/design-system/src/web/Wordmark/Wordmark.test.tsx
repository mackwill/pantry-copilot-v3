import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Wordmark } from './Wordmark.js';

describe('Wordmark', () => {
  it('renders Pantry·Co·Pilot with the Co in italic accent', () => {
    const { container } = render(<Wordmark />);
    expect(container.textContent).toBe('PantryCoPilot');
    const em = container.querySelector('em');
    expect(em?.textContent).toBe('Co');
  });
});
