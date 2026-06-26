import { describe, expect, it } from 'vitest';
import { installDisposableSymbols } from './polyfills';

interface SymbolHost {
  dispose?: symbol;
  asyncDispose?: symbol;
}
interface GlobalHost {
  SuppressedError?: unknown;
}

describe('installDisposableSymbols', () => {
  it('installs dispose/asyncDispose/SuppressedError on hosts that lack them (Hermes)', () => {
    const symbolHost: SymbolHost = {};
    const globalHost: GlobalHost = {};

    installDisposableSymbols(symbolHost, globalHost);

    expect(typeof symbolHost.dispose).toBe('symbol');
    expect(typeof symbolHost.asyncDispose).toBe('symbol');
    expect(typeof globalHost.SuppressedError).toBe('function');
  });

  it('uses the same well-known symbols the tRPC client falls back to', () => {
    // @trpc/server's makeResource writes obj[Symbol.dispose]; @trpc/client's
    // using-helper reads obj[Symbol.dispose || Symbol.for('Symbol.dispose')].
    // After the polyfill the producer key must equal the consumer fallback key.
    const symbolHost: SymbolHost = {};

    installDisposableSymbols(symbolHost, {});

    expect(symbolHost.dispose).toBe(Symbol.for('Symbol.dispose'));
    expect(symbolHost.asyncDispose).toBe(Symbol.for('Symbol.asyncDispose'));
  });

  it('makes a makeResource-style write resolvable by the using-helper lookup', () => {
    const symbolHost: SymbolHost = {};
    installDisposableSymbols(symbolHost, {});

    // Producer side (mirrors @trpc/server makeResource).
    const producerKey = symbolHost.dispose as symbol;
    const resource: Record<symbol, () => void> = {};
    resource[producerKey] = () => {};

    // Consumer side (mirrors the oxc usingCtx lookup).
    const consumerKey = symbolHost.dispose ?? Symbol.for('Symbol.dispose');
    expect(typeof resource[consumerKey]).toBe('function');
  });

  it('does not overwrite symbols the engine already provides', () => {
    const existing = Symbol('existing-dispose');
    const symbolHost: SymbolHost = { dispose: existing };

    installDisposableSymbols(symbolHost, {});

    expect(symbolHost.dispose).toBe(existing);
  });

  it('SuppressedError carries the error and suppressed values', () => {
    const globalHost: GlobalHost = {};
    installDisposableSymbols({}, globalHost);

    const Ctor = globalHost.SuppressedError as new (
      error: unknown,
      suppressed: unknown,
      message?: string,
    ) => Error & { error: unknown; suppressed: unknown };
    const err = new Ctor('inner', 'outer', 'both failed');

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('SuppressedError');
    expect(err.error).toBe('inner');
    expect(err.suppressed).toBe('outer');
    expect(err.message).toBe('both failed');
  });
});
