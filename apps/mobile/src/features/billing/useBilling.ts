import { type PlanId, PLAN_CATALOG } from '@pantry/contracts';
import { useCallback, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { purchases } from './purchases.js';

export type BillingStatus = 'idle' | 'purchasing' | 'restoring' | 'error';

export interface BillingState {
  status: BillingStatus;
  annual: boolean;
  selectedPlan: PlanId;
  error?: string | undefined;
}

export interface UseBillingOptions {
  /** Fired after a successful purchase + server sync (screens navigate here). */
  onPurchased?: (planId: PlanId) => void;
  /** Fired after a successful restore + server sync. */
  onRestored?: () => void;
}

export interface UseBillingResult extends BillingState {
  setAnnual: (annual: boolean) => void;
  selectPlan: (planId: PlanId) => void;
  purchase: (planId: PlanId) => Promise<void>;
  restore: () => Promise<void>;
}

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function packageFor(planId: PlanId, annual: boolean): string {
  const plan = PLAN_CATALOG[planId];
  return annual ? plan.rcAnnualPackage : plan.rcMonthlyPackage;
}

export function useBilling(options: UseBillingOptions = {}): UseBillingResult {
  const { onPurchased, onRestored } = options;
  const [state, setState] = useState<BillingState>({
    status: 'idle',
    annual: true,
    selectedPlan: 'pro',
  });
  /** Mirror of `annual` so async purchase flows read the latest value. */
  const annualRef = useRef(state.annual);

  const setAnnual = useCallback((annual: boolean) => {
    annualRef.current = annual;
    setState((prev) => ({ ...prev, annual }));
  }, []);

  const selectPlan = useCallback((selectedPlan: PlanId) => {
    setState((prev) => ({ ...prev, selectedPlan }));
  }, []);

  const purchase = useCallback(
    async (planId: PlanId): Promise<void> => {
      setState((prev) => ({ ...prev, status: 'purchasing', error: undefined }));
      try {
        await purchases.purchasePackage(packageFor(planId, annualRef.current));
        await api.subscription.syncFromRevenueCat.mutate();
        setState((prev) => ({ ...prev, status: 'idle', error: undefined }));
        onPurchased?.(planId);
      } catch (err) {
        setState((prev) => ({ ...prev, status: 'error', error: messageOf(err) }));
      }
    },
    [onPurchased],
  );

  const restore = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, status: 'restoring', error: undefined }));
    try {
      await purchases.restorePurchases();
      await api.subscription.syncFromRevenueCat.mutate();
      setState((prev) => ({ ...prev, status: 'idle', error: undefined }));
      onRestored?.();
    } catch (err) {
      setState((prev) => ({ ...prev, status: 'error', error: messageOf(err) }));
    }
  }, [onRestored]);

  return { ...state, setAnnual, selectPlan, purchase, restore };
}
