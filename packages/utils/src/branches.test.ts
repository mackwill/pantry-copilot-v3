import { describe, expect, it } from 'vitest';
import type { GenerationRequest } from '@pantry/contracts';
import { buildBranchInput } from './branches';

const base: GenerationRequest = { prompt: 'cozy dinner', pantryItemIds: [], weirdness: 40 };

describe('buildBranchInput', () => {
  it('weirder bumps weirdness by 20 and nudges the prompt', () => {
    const next = buildBranchInput(base, 'weirder');
    expect(next.weirdness).toBe(60);
    expect(next.prompt).toContain('cozy dinner');
    expect(next.prompt.length).toBeGreaterThan(base.prompt.length);
  });
  it('caps weirdness at 100', () => {
    expect(buildBranchInput({ ...base, weirdness: 95 }, 'weirder').weirdness).toBe(100);
  });
  it('appends each suffix idempotently (spamming does not duplicate)', () => {
    const once = buildBranchInput(base, 'vegetarian');
    const twice = buildBranchInput(once, 'vegetarian');
    expect(twice.prompt).toBe(once.prompt);
  });
  it('weirder is idempotent on the prompt suffix but still re-bumps weirdness', () => {
    const once = buildBranchInput(base, 'weirder');
    const twice = buildBranchInput(once, 'weirder');
    expect(twice.prompt).toBe(once.prompt);
    expect(twice.weirdness).toBe(80);
  });
  it('faster / new-angle append distinct suffixes', () => {
    expect(buildBranchInput(base, 'faster').prompt).not.toBe(buildBranchInput(base, 'new-angle').prompt);
  });
  it('preserves pantryItemIds', () => {
    const withItems: GenerationRequest = { ...base, pantryItemIds: ['11111111-1111-1111-1111-111111111111'] };
    expect(buildBranchInput(withItems, 'faster').pantryItemIds).toEqual(withItems.pantryItemIds);
  });
});
