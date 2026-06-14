import { describe, expect, it } from 'vitest';
import { inventoryEventSchema } from '../index';

describe('inventory event', () => {
  it('accepts an added event with a snapshot', () => {
    const ev = {
      id: crypto.randomUUID(), itemId: crypto.randomUUID(), kind: 'added',
      quantityDelta: 1, createdAt: new Date().toISOString(),
    };
    expect(inventoryEventSchema.safeParse(ev).success).toBe(true);
  });
  it('rejects an unknown kind', () => {
    const ev = { id: crypto.randomUUID(), itemId: crypto.randomUUID(), kind: 'teleported', quantityDelta: 0, createdAt: new Date().toISOString() };
    expect(inventoryEventSchema.safeParse(ev).success).toBe(false);
  });
});
