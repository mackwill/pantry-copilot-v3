import { loadEnv } from '@pantry/config/env';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().default('http://localhost:4000'),
    /** Comma-separable list of allowed browser origins. */
    WEB_ORIGIN: z.string().default('http://localhost:3000'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_SECRET: z.string().optional(),
    AUTH_DEV_MAGIC_LINK: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  })
  .refine((env) => !(env.AUTH_DEV_MAGIC_LINK && env.NODE_ENV === 'production'), {
    message: 'AUTH_DEV_MAGIC_LINK must not be enabled in production',
  });

export type Env = z.infer<typeof schema>;

export function readEnv(source?: Record<string, string | undefined>): Env {
  return loadEnv(schema, source);
}

export function webOrigins(env: Env): string[] {
  return env.WEB_ORIGIN.split(',').map((o) => o.trim());
}
