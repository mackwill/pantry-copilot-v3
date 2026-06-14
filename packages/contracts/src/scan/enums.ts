import { z } from 'zod';

/** Image MIME types the AI service accepts for a pantry scan. */
export const SCAN_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** `image_scans.status` lifecycle: processing → succeeded|failed → confirmed. */
export const SCAN_STATUSES = ['processing', 'succeeded', 'failed', 'confirmed'] as const;

/** AI providers the service can route an extraction through. */
export const AI_PROVIDERS = ['anthropic', 'openai', 'mock'] as const;

export const scanMediaTypeSchema = z.enum(SCAN_MEDIA_TYPES);
export const scanStatusSchema = z.enum(SCAN_STATUSES);
export const aiProviderSchema = z.enum(AI_PROVIDERS);

export type ScanMediaType = z.infer<typeof scanMediaTypeSchema>;
export type ScanStatus = z.infer<typeof scanStatusSchema>;
export type AIProviderName = z.infer<typeof aiProviderSchema>;
