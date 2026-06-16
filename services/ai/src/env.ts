import { loadEnv } from '@pantry/config/env';
import { AI_PROVIDERS } from '@pantry/contracts';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4001),
  /** Shared secret the API service presents as `Authorization: Bearer …`. */
  AI_SERVICE_TOKEN: z.string().min(32),
  DEFAULT_AI_PROVIDER: z.enum(AI_PROVIDERS).default('mock'),
  /** Optional secondary provider; when set, requests run through withFallback. */
  AI_FALLBACK_PROVIDER: z.enum(AI_PROVIDERS).optional(),
  /** Default Anthropic vision model. */
  DEFAULT_AI_MODEL: z.string().default('claude-sonnet-4-6'),
  /** Default OpenAI vision model. */
  OPENAI_MODEL: z.string().default('gpt-4o'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  /** Hard ceiling on a single generation stream before it is aborted with a timeout error. */
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
});

export type Env = z.infer<typeof schema>;

export function readEnv(source?: Record<string, string | undefined>): Env {
  return loadEnv(schema, source);
}
