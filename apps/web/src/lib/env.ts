import { z } from 'zod';

const schema = z.object({
  VITE_API_URL: z.string().default('http://localhost:4000'),
});

export const env = schema.parse({
  VITE_API_URL: import.meta.env['VITE_API_URL'] as string | undefined,
});
