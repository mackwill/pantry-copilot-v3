/**
 * Per-request correlation id minted on the client so a single user action
 * threads web/mobile → api → ai under one id in the logs. The API honours an
 * inbound `x-request-id` (see services/api genReqId); this is the source.
 */

/**
 * Non-crypto UUIDv4 used when the runtime lacks `crypto.randomUUID`. Hermes
 * (Expo / React Native) has no global `crypto`, so a bare `crypto.randomUUID()`
 * throws `ReferenceError: Property 'crypto' doesn't exist` — which broke
 * recipe-generation subscriptions. A correlation id needs no cryptographic
 * randomness, so `Math.random` is fine here.
 */
function fallbackRequestId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return fallbackRequestId();
}

export function requestIdHeaders(): { 'x-request-id': string } {
  return { 'x-request-id': newRequestId() };
}
