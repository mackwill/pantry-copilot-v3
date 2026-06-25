import { PLAN_CATALOG } from '@pantry/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { billingStrings } from '../strings';
import { PlanOption } from './PlanOption';

describe('PlanOption', () => {
  it('renders the plan name, annual price + period, and tagline', () => {
    render(
      <PlanOption
        plan={PLAN_CATALOG.pro}
        annual
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('Pro')).toBeTruthy();
    expect(screen.getByText(`$${String(PLAN_CATALOG.pro.priceAnnual)}`)).toBeTruthy();
    expect(screen.getByText(billingStrings.planOption.perYear)).toBeTruthy();
    expect(screen.getByText(billingStrings.planOption.tagline.pro)).toBeTruthy();
  });

  it('renders the monthly price + period when annual is off', () => {
    render(
      <PlanOption
        plan={PLAN_CATALOG.basic}
        annual={false}
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText(`$${String(PLAN_CATALOG.basic.priceMonthly)}`)).toBeTruthy();
    expect(screen.getByText(billingStrings.planOption.perMonth)).toBeTruthy();
  });

  it('shows the best-value badge only on a highlighted plan', () => {
    const { rerender } = render(
      <PlanOption
        plan={PLAN_CATALOG.pro}
        annual
        selected
        highlight
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText(billingStrings.planOption.popularBadge)).toBeTruthy();
    rerender(
      <PlanOption
        plan={PLAN_CATALOG.basic}
        annual
        selected={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.queryByText(billingStrings.planOption.popularBadge)).toBeNull();
  });

  it('fires onSelect with the plan id when pressed', () => {
    const onSelect = vi.fn();
    render(
      <PlanOption
        plan={PLAN_CATALOG.pro}
        annual
        selected={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByTestId('plan-option-pro'));
    expect(onSelect).toHaveBeenCalledWith('pro');
  });
});
