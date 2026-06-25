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
    /** Per-user/minute ceiling on AI generation + scan procedures (cost guard). */
    AI_ACTION_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
    /** Network-isolated AI service the scan router calls over REST. */
    AI_SERVICE_URL: z.url().default('http://localhost:4001'),
    /** Bearer token presented to the AI service (must match its AI_SERVICE_TOKEN). */
    AI_SERVICE_TOKEN: z.string().optional(),
    // ── Subscription limits (per-period; free = weekly per board) ──
    AI_FREE_RECIPES_PER_WEEK: z.coerce.number().int().nonnegative().default(3),
    AI_FREE_SCANS_PER_WEEK: z.coerce.number().int().nonnegative().default(2),
    AI_BASIC_RECIPES_PER_WEEK: z.coerce.number().int().nonnegative().default(10),
    AI_BASIC_SCANS_PER_WEEK: z.coerce.number().int().nonnegative().default(5),
    /** Pro is effectively unlimited — a high ceiling, not Infinity, so counters stay finite. */
    AI_PRO_RECIPES_PER_WEEK: z.coerce.number().int().nonnegative().default(100000),
    AI_PRO_SCANS_PER_WEEK: z.coerce.number().int().nonnegative().default(100000),
    AI_TOP_UP_CREDIT_VALUE: z.coerce.number().int().positive().default(10),
    // ── RevenueCat ──
    REVENUECAT_SECRET_API_KEY: z.string().optional(),
    REVENUECAT_API_BASE: z.url().default('https://api.revenuecat.com'),
    REVENUECAT_PRO_ENTITLEMENT_ID: z.string().default('pro'),
    REVENUECAT_BASIC_ENTITLEMENT_ID: z.string().default('basic'),
    /** Shared secret RC sends in the webhook Authorization header. */
    REVENUECAT_WEBHOOK_AUTH: z.string().optional(),
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
