import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button.js';

describe('Button', () => {
  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies kind and size variant classes (primary/md default)', () => {
    render(<Button>Go</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('primary');
    expect(btn.className).toContain('md');
  });

  it('supports all design kinds', () => {
    for (const kind of ['primary', 'secondary', 'ghost', 'inverse', 'danger'] as const) {
      const { unmount } = render(<Button kind={kind}>K</Button>);
      expect(screen.getByRole('button').className).toContain(kind);
      unmount();
    }
  });

  it('does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Nope
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders full-width variant', () => {
    render(<Button full>Wide</Button>);
    expect(screen.getByRole('button').className).toContain('full');
  });
});
