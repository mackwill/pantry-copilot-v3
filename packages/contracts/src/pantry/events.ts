import { z } from 'zod';
import { inventoryEventKindSchema } from './enums';

export const inventoryEventSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
  kind: inventoryEventKindSchema,
  quantityDelta: z.number(),
  createdAt: z.string(),
});

export type InventoryEvent = z.infer<typeof inventoryEventSchema>;
