import { z } from 'zod';

/** Cook-session lifecycle: one `active` per user, terminal once completed/abandoned. */
export const COOK_SESSION_STATUSES = ['active', 'completed', 'abandoned'] as const;
export const cookSessionStatusSchema = z.enum(COOK_SESSION_STATUSES);
export type CookSessionStatus = z.infer<typeof cookSessionStatusSchema>;

/** The session DTO the API returns — enough to render the in-session screen and resume. */
export const cookSessionSchema = z.object({
  id: z.uuid(),
  recipeId: z.uuid(),
  status: cookSessionStatusSchema,
  currentStepIndex: z.number().int().min(0),
  totalSteps: z.number().int().min(1),
  recipeTitle: z.string(),
  startedAt: z.string(),
});
export type CookSession = z.infer<typeof cookSessionSchema>;

export const startSessionInputSchema = z.object({ recipeId: z.uuid() });
export type StartSessionInput = z.infer<typeof startSessionInputSchema>;

export const advanceStepInputSchema = z.object({
  sessionId: z.uuid(),
  stepIndex: z.number().int().min(0),
});
export type AdvanceStepInput = z.infer<typeof advanceStepInputSchema>;

export const abandonSessionInputSchema = z.object({ sessionId: z.uuid() });
export type AbandonSessionInput = z.infer<typeof abandonSessionInputSchema>;
