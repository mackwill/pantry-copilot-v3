import { z } from 'zod';
import { createPantryItemInput } from '../pantry/item';
import { imageScanResultSchema } from './extraction';
import { scanStatusSchema } from './enums';

/** Client-facing image-scan record (DTO returned from the API). */
export const imageScanSchema = z.object({
  id: z.uuid(),
  status: scanStatusSchema,
  result: imageScanResultSchema,
  createdAt: z.string(),
});
export type ImageScan = z.infer<typeof imageScanSchema>;

/** Confirm a subset of a scan's extracted items into the pantry. */
export const confirmScanInput = z.object({
  scanId: z.uuid(),
  items: z.array(createPantryItemInput).min(1),
});
export type ConfirmScanInput = z.infer<typeof confirmScanInput>;
