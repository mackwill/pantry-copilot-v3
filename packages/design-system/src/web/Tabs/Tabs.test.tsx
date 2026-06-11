import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs.js';

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'produce', label: 'Produce' },
  { id: 'dairy', label: 'Dairy' },
];

describe('Tabs', () => {
  it('renders a tablist with one tab per item', () => {
    render(<Tabs tabs={tabs} activeId="all" />);
    expect(screen.getByRole('tablist')).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('marks the active tab as selected — and only it', () => {
    render(<Tabs tabs={tabs} activeId="produce" />);
    const selected = screen.getByRole('tab', { selected: true });
    expect(selected.textContent).toBe('Produce');
    expect(screen.getAllByRole('tab', { selected: false })).toHaveLength(2);
  });

  it('gives the active tab the unmistakable inverse treatment', () => {
    render(<Tabs tabs={tabs} activeId="dairy" />);
    expect(screen.getByRole('tab', { selected: true }).className).toContain('active');
  });

  it('fires onChange with the tab id', async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={tabs} activeId="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Dairy' }));
    expect(onChange).toHaveBeenCalledWith('dairy');
  });
});
