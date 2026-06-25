import { z } from 'zod';

export const PlanId = z.enum(['basic', 'pro']);
export type PlanId = z.infer<typeof PlanId>;

export interface PlanDef {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  annualSavingsPct: number;
  features: string[];
  /** RevenueCat package identifiers — set from dashboard config at integration time. */
  rcMonthlyPackage: string;
  rcAnnualPackage: string;
}

/** Catalog drives plan-card rendering; copy (features/blurbs) lives in feature strings. */
export const PLAN_CATALOG: Record<PlanId, PlanDef> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 4.99,
    priceAnnual: 39,
    annualSavingsPct: 35,
    features: [
      '10 recipe generations / week',
      '5 pantry or receipt scans / week',
      'Weirdness up to adventurous',
      '1 household member',
    ],
    rcMonthlyPackage: '$rc_monthly_basic',
    rcAnnualPackage: '$rc_annual_basic',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9.99,
    priceAnnual: 79,
    annualSavingsPct: 33,
    features: [
      'Unlimited generations & scans',
      'Full weirdness (chaotic unlocked)',
      'Household sharing · up to 5',
      'Web + mobile · sync everywhere',
      'Priority generation (10× faster)',
    ],
    rcMonthlyPackage: '$rc_monthly',
    rcAnnualPackage: '$rc_annual',
  },
};
