import { PLAN_CATALOG } from '@pantry/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlanCard } from './PlanCard';

const basic = PLAN_CATALOG.basic;
const pro = PLAN_CATALOG.pro;

describe('PlanCard', () => {
  it('renders the plan name and feature bullets', () => {
    render(<PlanCard plan={basic} annual={false} onChoose={vi.fn()} />);
    expect(screen.getByText(basic.name)).toBeTruthy();
    for (const feature of basic.features) {
      expect(screen.getByText(feature)).toBeTruthy();
    }
  });

  it('shows the monthly price with /mo when annual is off', () => {
    render(<PlanCard plan={basic} annual={false} onChoose={vi.fn()} />);
    expect(screen.getByText('$4.99')).toBeTruthy();
    expect(screen.getByText('/mo')).toBeTruthy();
  });

  it('shows the annual price with /yr and savings when annual is on', () => {
    render(<PlanCard plan={pro} annual onChoose={vi.fn()} />);
    expect(screen.getByText('$79')).toBeTruthy();
    expect(screen.getByText('/yr')).toBeTruthy();
    expect(screen.getByText(/save 33%/i)).toBeTruthy();
  });

  it('renders the popular badge only when highlighted', () => {
    const { rerender } = render(<PlanCard plan={pro} annual onChoose={vi.fn()} />);
    expect(screen.queryByText(/best value/i)).toBeNull();
    rerender(<PlanCard plan={pro} annual highlight onChoose={vi.fn()} />);
    expect(screen.getByText(/best value/i)).toBeTruthy();
  });

  it('fires onChoose with the plan id when the CTA is clicked', async () => {
    const onChoose = vi.fn();
    render(<PlanCard plan={pro} annual highlight onChoose={onChoose} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onChoose).toHaveBeenCalledWith('pro');
  });
});
