/**
 * Hermes (the JS engine behind Expo Go and dev builds) ships without the
 * explicit-resource-management globals that tRPC v11's `httpSubscriptionLink`
 * depends on: `Symbol.dispose`, `Symbol.asyncDispose`, and `SuppressedError`.
 *
 * Without them recipe generation fails with "The generation hit a snag":
 * `@trpc/server`'s `makeResource` writes its disposer to `obj[Symbol.dispose]`
 * — which is `obj["undefined"]` on Hermes — while `@trpc/client`'s bundled
 * `using` helper reads `obj[Symbol.dispose || Symbol.for('Symbol.dispose')]`,
 * i.e. the real well-known symbol. The keys disagree, the lookup throws, and
 * the error surfaces as an empty `SuppressedError` before the request leaves
 * the device.
 *
 * Installing these as real symbols makes producer and consumer agree. We use
 * `Symbol.for(...)` so the installed value is identical to the helper's own
 * fallback key. Must run before any tRPC code; `apps/mobile/index.js` imports
 * this module first.
 */

interface DisposableSymbolHost {
  dispose?: symbol;
  asyncDispose?: symbol;
}

interface SuppressedErrorHost {
  SuppressedError?: unknown;
}

/** Mirrors the ES2026 `SuppressedError` shape the oxc `using` helper expects. */
class SuppressedErrorPolyfill extends Error {
  readonly error: unknown;
  readonly suppressed: unknown;

  constructor(error: unknown, suppressed: unknown, message?: string) {
    super(message);
    this.name = 'SuppressedError';
    this.error = error;
    this.suppressed = suppressed;
  }
}

/**
 * Install the disposable-resource globals on the given hosts if missing.
 * Hosts are injectable because the real `Symbol.dispose` is non-configurable
 * and cannot be deleted to simulate Hermes in a Node test environment.
 */
export function installDisposableSymbols(
  symbolHost: DisposableSymbolHost = Symbol,
  globalHost: SuppressedErrorHost = globalThis,
): void {
  symbolHost.dispose ??= Symbol.for('Symbol.dispose');
  symbolHost.asyncDispose ??= Symbol.for('Symbol.asyncDispose');
  globalHost.SuppressedError ??= SuppressedErrorPolyfill;
}

installDisposableSymbols();
