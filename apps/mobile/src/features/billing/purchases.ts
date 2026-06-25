/**
 * Thin wrapper around the `react-native-purchases` (RevenueCat) native SDK.
 *
 * CRITICAL — Expo Go has no native module. The project runs in Expo Go (no dev
 * build), where importing `react-native-purchases` at module-load throws. So:
 *   - the SDK is reached only via a LAZY `import('react-native-purchases')`
 *     inside the guarded path — never a top-level static import;
 *   - every call is gated by a platform RevenueCat key (`isConfigured`);
 *   - when unconfigured, methods no-op (configure/logIn) or throw a typed
 *     {@link PurchasesUnavailableError} (getOfferings/purchasePackage/restore),
 *     letting `useBilling` fall back to a sandbox path so screens still render.
 *
 * A real purchase requires a dev build / EAS build (see docs/decisions.md).
 */
import { Platform } from 'react-native';
import { env } from '../../lib/env.js';

export class PurchasesUnavailableError extends Error {
  constructor() {
    super('RevenueCat purchases are unavailable (no dev build or missing SDK key).');
    this.name = 'PurchasesUnavailableError';
  }
}

/** Minimal local view of the RC SDK surface we touch — avoids a hard type dep. */
interface RcPackage {
  identifier: string;
}
interface RcOffering {
  availablePackages: RcPackage[];
}
interface RcOfferings {
  all: Record<string, RcOffering>;
}
interface RcSdk {
  configure(opts: { apiKey: string }): void;
  logIn(appUserId: string): Promise<unknown>;
  getOfferings(): Promise<RcOfferings>;
  purchasePackage(rcPackage: RcPackage): Promise<unknown>;
  restorePurchases(): Promise<unknown>;
}

export interface Purchases {
  /** True when a platform RC key is present (i.e. real purchases may work). */
  readonly isConfigured: boolean;
  configure(): Promise<void>;
  logIn(appUserId: string): Promise<void>;
  getOfferings(): Promise<RcOfferings>;
  /** Resolve the RC package by identifier and purchase it. */
  purchasePackage(packageId: string): Promise<void>;
  restorePurchases(): Promise<void>;
}

function platformKey(): string | undefined {
  return Platform.OS === 'android'
    ? env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    : env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
}

/**
 * Lazily load the native SDK. Returns null when the module is absent (Expo Go),
 * swallowing the load-time throw so the wrapper degrades to a no-op.
 */
async function loadSdk(): Promise<RcSdk | null> {
  try {
    const mod = (await import('react-native-purchases')) as unknown as {
      default: RcSdk;
    };
    return mod.default;
  } catch {
    return null;
  }
}

function findPackage(offerings: RcOfferings, packageId: string): RcPackage | undefined {
  for (const offering of Object.values(offerings.all)) {
    const match = offering.availablePackages.find((p) => p.identifier === packageId);
    if (match) return match;
  }
  return undefined;
}

export function createPurchases(): Purchases {
  const apiKey = platformKey();
  const isConfigured = typeof apiKey === 'string' && apiKey.length > 0;

  let configured = false;
  async function ensureSdk(): Promise<RcSdk> {
    if (apiKey === undefined || apiKey.length === 0) throw new PurchasesUnavailableError();
    const sdk = await loadSdk();
    if (sdk === null) throw new PurchasesUnavailableError();
    if (!configured) {
      sdk.configure({ apiKey });
      configured = true;
    }
    return sdk;
  }

  return {
    isConfigured,
    async configure(): Promise<void> {
      // No-op in Expo Go / unconfigured — must never throw from bootstrap.
      if (!isConfigured) return;
      try {
        await ensureSdk();
      } catch {
        // Native module absent (Expo Go): stay unconfigured silently.
      }
    },
    async logIn(appUserId: string): Promise<void> {
      if (!isConfigured) return;
      try {
        const sdk = await ensureSdk();
        await sdk.logIn(appUserId);
      } catch {
        // Native module absent (Expo Go): no-op.
      }
    },
    async getOfferings(): Promise<RcOfferings> {
      const sdk = await ensureSdk();
      return sdk.getOfferings();
    },
    async purchasePackage(packageId: string): Promise<void> {
      const sdk = await ensureSdk();
      const offerings = await sdk.getOfferings();
      const rcPackage = findPackage(offerings, packageId);
      if (rcPackage === undefined) {
        throw new Error(`RevenueCat package not found: ${packageId}`);
      }
      await sdk.purchasePackage(rcPackage);
    },
    async restorePurchases(): Promise<void> {
      const sdk = await ensureSdk();
      await sdk.restorePurchases();
    },
  };
}

export const purchases: Purchases = createPurchases();
