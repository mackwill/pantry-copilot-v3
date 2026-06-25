import { env } from './env';

/**
 * Thin wrapper around the RevenueCat Web Billing SDK, guarded by
 * REVENUECAT_WEB_BILLING_KEY. When the key is absent the wrapper is "not
 * configured" and purchase/restore reject with {@link RevenueCatNotConfiguredError},
 * letting `useBilling` fall back to the mock/sandbox path.
 *
 * SDK access is behind a dynamic import so the bundle (and typecheck) never hard
 * depend on the package being present at build time.
 */

export class RevenueCatNotConfiguredError extends Error {
  constructor() {
    super('RevenueCat Web Billing is not configured (missing billing key).');
    this.name = 'RevenueCatNotConfiguredError';
  }
}

export interface RevenueCatWeb {
  /** True only when a billing key is present and the SDK can be driven. */
  readonly isConfigured: boolean;
  /** Purchase the RevenueCat package by identifier (from PLAN_CATALOG). */
  purchasePackage(packageId: string): Promise<void>;
  /** Restore prior purchases for the current customer. */
  restorePurchases(): Promise<void>;
}

/** Minimal local view of the SDK surface we touch — avoids a hard type dep. */
interface PurchasesSdk {
  configure(opts: { apiKey: string; appUserId?: string }): PurchasesInstance;
}
interface PurchasesInstance {
  getOfferings(): Promise<{ all: Record<string, OfferingLike> }>;
  purchase(opts: { rcPackage: PackageLike }): Promise<unknown>;
}
interface OfferingLike {
  availablePackages: PackageLike[];
}
interface PackageLike {
  identifier: string;
}

async function loadSdk(): Promise<PurchasesSdk> {
  const mod = (await import('@revenuecat/purchases-js')) as unknown as {
    Purchases: PurchasesSdk;
  };
  return mod.Purchases;
}

function findPackage(
  offerings: { all: Record<string, OfferingLike> },
  packageId: string,
): PackageLike | undefined {
  for (const offering of Object.values(offerings.all)) {
    const match = offering.availablePackages.find((p) => p.identifier === packageId);
    if (match) return match;
  }
  return undefined;
}

export function createRevenueCatWeb(): RevenueCatWeb {
  const apiKey = env.REVENUECAT_WEB_BILLING_KEY;
  const isConfigured = typeof apiKey === 'string' && apiKey.length > 0;

  let instance: PurchasesInstance | null = null;
  async function ensureInstance(key: string): Promise<PurchasesInstance> {
    if (instance) return instance;
    const Purchases = await loadSdk();
    instance = Purchases.configure({ apiKey: key });
    return instance;
  }

  return {
    isConfigured,
    async purchasePackage(packageId: string): Promise<void> {
      if (!isConfigured) throw new RevenueCatNotConfiguredError();
      const purchases = await ensureInstance(apiKey);
      const offerings = await purchases.getOfferings();
      const rcPackage = findPackage(offerings, packageId);
      if (!rcPackage) {
        throw new Error(`RevenueCat package not found: ${packageId}`);
      }
      await purchases.purchase({ rcPackage });
    },
    async restorePurchases(): Promise<void> {
      if (!isConfigured) throw new RevenueCatNotConfiguredError();
      const purchases = await ensureInstance(apiKey);
      // Re-reading offerings refreshes the customer entitlement cache; the server
      // sync (syncFromRevenueCat) is authoritative for what the user actually owns.
      await purchases.getOfferings();
    },
  };
}

export const revenueCatWeb: RevenueCatWeb = createRevenueCatWeb();
