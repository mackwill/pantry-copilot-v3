import { z } from 'zod';

/** The request a client sends to start a recipe generation. */
export const generationRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  pantryItemIds: z.array(z.uuid()).default([]),
  weirdness: z.number().int().min(0).max(100),
});
export type GenerationRequest = z.infer<typeof generationRequestSchema>;

/**
 * A pantry item resolved to the shape the AI service reasons over. The
 * API builds these from `pantryItemIds` before calling the AI service;
 * the client never sends names directly.
 */
export const aiPantryChipSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.number().nonnegative().nullable().default(null),
  unit: z.string().max(40).nullable().default(null),
  expiresInDays: z.number().int().nullable().default(null),
});
export type AIPantryChip = z.infer<typeof aiPantryChipSchema>;

/**
 * The request the AI service receives (server-to-server). Richer than
 * the client request: pantry uuids are resolved to named chips, and the
 * API may surface items it wants forced into the result.
 */
export const aiGenerationRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  weirdness: z.number().int().min(0).max(100),
  pantry: z.array(aiPantryChipSchema).default([]),
  mustInclude: z.array(z.string().min(1).max(120)).default([]),
  /** Hard dietary constraints (diet + allergies), surfaced verbatim in the system prompt. */
  dietary: z.array(z.string().min(1).max(120)).default([]),
});
export type AIGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;
