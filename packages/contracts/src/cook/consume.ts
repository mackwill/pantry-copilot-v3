import { z } from 'zod';
import { pantryUnitSchema } from '../pantry/enums';

/**
 * One pantry item consumed by a finished cook session. `quantityUsed` is the
 * resolved number the UI's steppers/pills produced; `finished` flags an item
 * the cook marked "used it all" so the transaction removes it outright.
 */
export const consumeItemSchema = z.object({
  pantryItemId: z.uuid(),
  quantityUsed: z.number().min(0),
  unit: pantryUnitSchema,
  finished: z.boolean(),
});
export type ConsumeItem = z.infer<typeof consumeItemSchema>;

export const consumeInputSchema = z.object({
  sessionId: z.uuid(),
  items: z.array(consumeItemSchema),
});
export type ConsumeInput = z.infer<typeof consumeInputSchema>;
