import { z } from 'zod';

const schema = z.object({
  VITE_API_URL: z.string().default('http://localhost:4000'),
  REVENUECAT_WEB_BILLING_KEY: z.string().min(1).optional(),
});

export const env = schema.parse({
  VITE_API_URL: import.meta.env['VITE_API_URL'] as string | undefined,
  REVENUECAT_WEB_BILLING_KEY: import.meta.env['VITE_REVENUECAT_WEB_BILLING_KEY'] as
    | string
    | undefined,
});
