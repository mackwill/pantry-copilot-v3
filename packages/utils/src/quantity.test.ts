import { describe, expect, it } from 'vitest';
import { deduct } from './quantity';

describe('deduct', () => {
  it('subtracts a partial use and leaves the item unfinished', () => {
    expect(deduct(5, 2)).toEqual({ remaining: 3, finished: false });
  });
  it('marks the item finished when the whole quantity is used', () => {
    expect(deduct(2, 2)).toEqual({ remaining: 0, finished: true });
  });
  it('clamps over-use to zero and finishes the item', () => {
    expect(deduct(1, 3)).toEqual({ remaining: 0, finished: true });
  });
  it('cleans up floating-point drift to the pantry 2-decimal precision', () => {
    expect(deduct(0.3, 0.1)).toEqual({ remaining: 0.2, finished: false });
  });
  it('treats a negative use as zero (no phantom restock)', () => {
    expect(deduct(5, -1)).toEqual({ remaining: 5, finished: false });
  });
  it('rounds the remaining to two decimals', () => {
    expect(deduct(5, 1.234)).toEqual({ remaining: 3.77, finished: false });
  });
});
