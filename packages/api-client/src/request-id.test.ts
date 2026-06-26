import { afterEach, describe, expect, it, vi } from 'vitest';
import { newRequestId, requestIdHeaders } from './request-id.js';

describe('request-id', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates a non-empty unique id each call', () => {
    const a = newRequestId();
    const b = newRequestId();
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });

  it('produces a fresh x-request-id header per call', () => {
    expect(requestIdHeaders()['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect(requestIdHeaders()['x-request-id']).not.toBe(requestIdHeaders()['x-request-id']);
  });

  it('falls back to a valid uuid when crypto is unavailable (Hermes)', () => {
    // Hermes (Expo/React Native) ships without the global `crypto`, so a bare
    // `crypto.randomUUID()` throws `ReferenceError: Property 'crypto' doesn't
    // exist` — which broke recipe-generation subscriptions. Correlation ids
    // need no cryptographic randomness, so we must degrade gracefully.
    vi.stubGlobal('crypto', undefined);

    const a = newRequestId();
    const b = newRequestId();
    expect(a).toMatch(/^[0-9a-f-]{36}$/);
    expect(a).not.toBe(b);
  });

  it('falls back when crypto exists but lacks randomUUID', () => {
    vi.stubGlobal('crypto', {});

    expect(newRequestId()).toMatch(/^[0-9a-f-]{36}$/);
  });
});
