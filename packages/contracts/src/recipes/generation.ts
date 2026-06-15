import { z } from 'zod';

/** The request a client sends to start a recipe generation. */
export const generationRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  pantryItemIds: z.array(z.uuid()).default([]),
  weirdness: z.number().int().min(0).max(100),
});
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
