import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('returns parsed values for a valid environment', () => {
    const schema = z.object({ DATABASE_URL: z.url() });
    const env = loadEnv(schema, { DATABASE_URL: 'postgres://u:p@localhost:5432/db' });
    expect(env.DATABASE_URL).toBe('postgres://u:p@localhost:5432/db');
  });

  it('throws listing every missing/invalid variable', () => {
    const schema = z.object({ DATABASE_URL: z.url(), PORT: z.coerce.number() });
    expect(() => loadEnv(schema, { PORT: 'not-a-number' })).toThrow(/DATABASE_URL[\s\S]*PORT/);
  });
});
