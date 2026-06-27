import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { generationStrings } from '../strings';
import { HomeContextCards } from './HomeContextCards';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const s = generationStrings.home;

describe('HomeContextCards', () => {
  const props = {
    expiring: [{ name: 'Carrots', qty: '3', exp: '2d', tone: 'warning' as const }],
    recent: [{ title: 'Soba', when: 'yesterday', time: '12m' }],
    tryHint: null,
  };

  it('links "Pantry →" to the pantry route', () => {
    render(<HomeContextCards {...props} />);
    expect(screen.getByText(s.pantryLink).closest('a')?.getAttribute('href')).toBe('/pantry');
  });

  it('links "Recipes →" to the recipes route', () => {
    render(<HomeContextCards {...props} />);
    expect(screen.getByText(s.recipesLink).closest('a')?.getAttribute('href')).toBe('/recipes');
  });
});
