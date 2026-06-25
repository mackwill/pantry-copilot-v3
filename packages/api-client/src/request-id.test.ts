import { describe, expect, it } from 'vitest';
import { newRequestId, requestIdHeaders } from './request-id.js';

describe('request-id', () => {
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
});
