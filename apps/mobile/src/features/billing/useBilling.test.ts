import { PLAN_CATALOG } from '@pantry/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const purchasePackage = vi.fn<(packageId: string) => Promise<void>>();
const restorePurchases = vi.fn<() => Promise<void>>();

vi.mock('./purchases', () => ({
  purchases: {
    isConfigured: true,
    purchasePackage: (id: string) => purchasePackage(id),
    restorePurchases: () => restorePurchases(),
  },
}));

const syncFromRevenueCat = vi.fn<() => Promise<unknown>>();

vi.mock('../../lib/api', () => ({
  api: {
    subscription: {
      syncFromRevenueCat: { mutate: () => syncFromRevenueCat() },
    },
  },
}));

import { useBilling } from './useBilling';

beforeEach(() => {
  purchasePackage.mockReset().mockResolvedValue(undefined);
  restorePurchases.mockReset().mockResolvedValue(undefined);
  syncFromRevenueCat.mockReset().mockResolvedValue({});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBilling (mobile)', () => {
  it('starts idle with pro selected and annual on', () => {
    const { result } = renderHook(() => useBilling());
    expect(result.current.status).toBe('idle');
    expect(result.current.selectedPlan).toBe('pro');
    expect(result.current.annual).toBe(true);
  });

  it('setAnnual and selectPlan update state', () => {
    const { result } = renderHook(() => useBilling());
    act(() => {
      result.current.setAnnual(false);
    });
    act(() => {
      result.current.selectPlan('basic');
    });
    expect(result.current.annual).toBe(false);
    expect(result.current.selectedPlan).toBe('basic');
  });

  it('purchase transitions idle→purchasing→idle, then purchases→syncs→onPurchased in order', async () => {
    const order: string[] = [];
    purchasePackage.mockImplementation(() => {
      order.push('purchase');
      return Promise.resolve();
    });
    syncFromRevenueCat.mockImplementation(() => {
      order.push('sync');
      return Promise.resolve({});
    });
    const onPurchased = vi.fn(() => order.push('onPurchased'));
    const { result } = renderHook(() => useBilling({ onPurchased }));

    let pending: Promise<void>;
    act(() => {
      pending = result.current.purchase('pro');
    });
    expect(result.current.status).toBe('purchasing');

    await act(async () => {
      await pending;
    });

    expect(result.current.status).toBe('idle');
    expect(purchasePackage).toHaveBeenCalledWith(PLAN_CATALOG.pro.rcAnnualPackage);
    expect(onPurchased).toHaveBeenCalledWith('pro');
    expect(order).toEqual(['purchase', 'sync', 'onPurchased']);
  });

  it('purchase uses the monthly package when annual is off', async () => {
    const { result } = renderHook(() => useBilling());
    act(() => {
      result.current.setAnnual(false);
    });
    await act(async () => {
      await result.current.purchase('basic');
    });
    expect(purchasePackage).toHaveBeenCalledWith(PLAN_CATALOG.basic.rcMonthlyPackage);
  });

  it('purchase failure transitions to error and does not sync or call onPurchased', async () => {
    const onPurchased = vi.fn();
    purchasePackage.mockRejectedValue(new Error('card declined'));
    const { result } = renderHook(() => useBilling({ onPurchased }));

    await act(async () => {
      await result.current.purchase('pro');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('card declined');
    expect(syncFromRevenueCat).not.toHaveBeenCalled();
    expect(onPurchased).not.toHaveBeenCalled();
  });

  it('purchase surfaces the Expo-Go-unavailable path as an error', async () => {
    purchasePackage.mockRejectedValue(
      Object.assign(new Error('purchases unavailable'), { name: 'PurchasesUnavailableError' }),
    );
    const { result } = renderHook(() => useBilling());
    await act(async () => {
      await result.current.purchase('pro');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('unavailable');
  });

  it('restore transitions idle→restoring→idle, syncs, and calls onRestored', async () => {
    const onRestored = vi.fn();
    const { result } = renderHook(() => useBilling({ onRestored }));

    let pending: Promise<void>;
    act(() => {
      pending = result.current.restore();
    });
    expect(result.current.status).toBe('restoring');

    await act(async () => {
      await pending;
    });

    expect(result.current.status).toBe('idle');
    expect(restorePurchases).toHaveBeenCalledTimes(1);
    expect(syncFromRevenueCat).toHaveBeenCalledTimes(1);
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it('restore failure transitions to error', async () => {
    restorePurchases.mockRejectedValue(new Error('no purchases'));
    const { result } = renderHook(() => useBilling());
    await act(async () => {
      await result.current.restore();
    });
    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error).toContain('no purchases');
  });
});
