import { z } from 'zod';
import { pantryCategorySchema, pantryLocationSchema, pantryUnitSchema } from '../pantry/enums';
import { aiProviderSchema, scanMediaTypeSchema } from './enums';

/** Request the AI service receives to extract pantry items from one image. */
export const aiImageExtractionRequestSchema = z.object({
  imageBase64: z.string().min(1),
  mediaType: scanMediaTypeSchema,
  hint: z.string().trim().max(280).optional(),
});
export type AIImageExtractionRequest = z.infer<typeof aiImageExtractionRequestSchema>;

/**
 * One ingredient extracted from a scan.
 *
 * Defensive parse semantics: every enum / numeric field uses `.catch(...)` so
 * malformed model output (out-of-enum category, out-of-range confidence, future
 * schema drift) is coerced to a safe fallback rather than throwing — the scan
 * endpoint must always be able to return a valid result. `name` /
 * `normalizedName` stay strict; a nameless ingredient is dropped one layer up.
 */
export const extractedIngredientSchema = z.object({
  name: z.string().min(1).max(120),
  normalizedName: z.string().min(1).max(120),
  category: pantryCategorySchema.nullable().catch(null),
  location: pantryLocationSchema.nullable().catch(null),
  quantity: z.number().nonnegative().nullable().catch(null),
  unit: pantryUnitSchema.nullable().catch(null),
  confidence: z.number().min(0).max(1).catch(0.5),
  notes: z.string().max(500).nullable().catch(null),
});
export type ExtractedIngredient = z.infer<typeof extractedIngredientSchema>;

/**
 * Lenient array parser: each item is validated independently and any item that
 * fails (e.g. missing `name`) is dropped instead of failing the whole result.
 */
const extractedIngredientArray = z
  .array(z.unknown())
  .catch([])
  .transform((items) =>
    items
      .map((item) => extractedIngredientSchema.safeParse(item))
      .filter((r): r is { success: true; data: ExtractedIngredient } => r.success)
      .map((r) => r.data),
  );

export const imageScanResultSchema = z.object({
  ingredients: extractedIngredientArray,
  duplicatesMerged: z.array(z.string()).catch([]).default([]),
  reviewNotes: z.string().max(1000).nullable().catch(null),
});
export type ImageScanResult = z.infer<typeof imageScanResultSchema>;

/** Response the AI service returns from `POST /scans/extract`. */
export const aiImageExtractionResponseSchema = z.object({
  provider: aiProviderSchema,
  model: z.string().min(1),
  result: imageScanResultSchema,
  tokensUsed: z.object({ input: z.number().int().nonnegative(), output: z.number().int().nonnegative() }),
});
export type AIImageExtractionResponse = z.infer<typeof aiImageExtractionResponseSchema>;
