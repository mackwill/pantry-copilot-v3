import { describe, expect, it } from 'vitest';
import { freshnessFor, rankByExpiration } from './expiration';

const today = new Date('2026-04-21T12:00:00Z');

describe('freshnessFor', () => {
  it('flags danger when past best-by', () => {
    expect(freshnessFor('2026-04-19', today).tone).toBe('danger');
  });
  it('flags warning within 3 days', () => {
    const f = freshnessFor('2026-04-23', today);
    expect(f.tone).toBe('warning');
    expect(f.daysLeft).toBe(2);
  });
  it('flags success when comfortably fresh', () => {
    expect(freshnessFor('2026-05-30', today).tone).toBe('success');
  });
  it('returns success/untracked when bestBy is null', () => {
    expect(freshnessFor(null, today).tone).toBe('success');
  });
});

describe('rankByExpiration', () => {
  it('orders danger first, then soonest best-by, untracked last', () => {
    const items = [
      { id: 'a', bestBy: null },
      { id: 'b', bestBy: '2026-04-19' },
      { id: 'c', bestBy: '2026-04-23' },
    ];
    expect(rankByExpiration(items, today).map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });
});
