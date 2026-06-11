import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WebShell, type WebShellProps } from './WebShell.js';

const baseProps: WebShellProps = {
  navItems: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'pantry', label: 'Pantry', icon: 'Refrigerator' },
    { id: 'cook', label: 'Cook', icon: 'ChefHat' },
  ],
  activeId: 'dashboard',
  search: { placeholder: 'Search ingredients, recipes, or ideas', shortcut: '⌘K' },
  children: <main>page body</main>,
};

describe('WebShell', () => {
  it('renders nav items and the page body', () => {
    render(<WebShell {...baseProps} />);
    expect(screen.getByRole('button', { name: /Dashboard/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Pantry/ })).toBeTruthy();
    expect(screen.getByText('page body')).toBeTruthy();
  });

  it('marks the active nav item with aria-current', () => {
    render(<WebShell {...baseProps} activeId="pantry" />);
    const active = screen.getByRole('button', { name: /Pantry/ });
    expect(active.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: /Dashboard/ }).getAttribute('aria-current')).toBeNull();
  });

  it('fires onNavigate with the item id', async () => {
    const onNavigate = vi.fn();
    render(<WebShell {...baseProps} onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole('button', { name: /Cook/ }));
    expect(onNavigate).toHaveBeenCalledWith('cook');
  });

  it('renders the secondary lists section and user identity when provided', () => {
    render(
      <WebShell
        {...baseProps}
        listsLabel="Lists"
        lists={[{ id: 'veg', label: 'Vegetarian', icon: 'Leaf' }]}
        user={{ initials: 'MS', name: 'Mara Singh', email: 'mara@home.kitchen' }}
      />,
    );
    expect(screen.getByText('Lists')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Vegetarian/ })).toBeTruthy();
    expect(screen.getByText('Mara Singh')).toBeTruthy();
    expect(screen.getByText('mara@home.kitchen')).toBeTruthy();
  });

  it('shows topbar search and right slot, hidden by hideTopbar', () => {
    const { rerender } = render(
      <WebShell {...baseProps} topbarRight={<button type="button">Add ingredient</button>} />,
    );
    expect(screen.getByText('Search ingredients, recipes, or ideas')).toBeTruthy();
    expect(screen.getByText('⌘K')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add ingredient' })).toBeTruthy();
    rerender(<WebShell {...baseProps} hideTopbar />);
    expect(screen.queryByText('Search ingredients, recipes, or ideas')).toBeNull();
  });
});
