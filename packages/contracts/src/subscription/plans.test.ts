import { describe, expect, it } from 'vitest';
import { PLAN_CATALOG, PlanId } from './plans.js';

describe('PLAN_CATALOG', () => {
  it('has basic and pro plans with monthly + annual prices', () => {
    expect(PlanId.parse('pro')).toBe('pro');
    const pro = PLAN_CATALOG.pro;
    expect(pro.priceMonthly).toBeGreaterThan(0);
    expect(pro.priceAnnual).toBeGreaterThan(0);
    expect(pro.features.length).toBeGreaterThan(0);
  });

  it('exposes exactly the two purchasable plans, keyed by id', () => {
    expect(Object.keys(PLAN_CATALOG).sort()).toEqual(['basic', 'pro']);
    expect(PLAN_CATALOG.basic.id).toBe('basic');
    expect(PLAN_CATALOG.pro.id).toBe('pro');
  });

  it('does not treat free as a purchasable plan', () => {
    expect(PlanId.safeParse('free').success).toBe(false);
  });

  it('keeps annual savings within a plausible range', () => {
    for (const plan of Object.values(PLAN_CATALOG)) {
      expect(plan.annualSavingsPct).toBeGreaterThan(0);
      expect(plan.annualSavingsPct).toBeLessThan(100);
    }
  });
});
