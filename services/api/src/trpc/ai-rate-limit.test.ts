import { describe, expect, it } from 'vitest';
import { __resetAiRateLimiter, consumeAiActionSlot } from './ai-rate-limit.js';

describe('consumeAiActionSlot', () => {
  it('allows up to max per window then blocks the same user', () => {
    __resetAiRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 3; i += 1) {
      expect(consumeAiActionSlot('user-1', 3, 60_000, now)).toBe(true);
    }
    expect(consumeAiActionSlot('user-1', 3, 60_000, now)).toBe(false);
  });

  it('isolates users and resets after the window', () => {
    __resetAiRateLimiter();
    const t0 = 1_000_000;
    expect(consumeAiActionSlot('a', 1, 60_000, t0)).toBe(true);
    expect(consumeAiActionSlot('a', 1, 60_000, t0)).toBe(false);
    expect(consumeAiActionSlot('b', 1, 60_000, t0)).toBe(true);
    expect(consumeAiActionSlot('a', 1, 60_000, t0 + 60_001)).toBe(true);
  });
});
