import type { z } from 'zod';

/** Parse env vars against a zod schema; fail fast with every problem listed. */
export function loadEnv<S extends z.ZodType>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
): z.infer<S> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid environment:\n${lines.join('\n')}`);
  }
  return result.data;
}
