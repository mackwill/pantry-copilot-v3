import { describe, expect, it } from 'vitest';
import { readEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgres://pantry:pantry@localhost:5432/pantry',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
};

describe('readEnv', () => {
  it('parses a minimal valid environment with defaults', () => {
    const env = readEnv(base);
    expect(env.PORT).toBe(4000);
    expect(env.WEB_ORIGIN).toBe('http://localhost:3000');
    expect(env.AUTH_DEV_MAGIC_LINK).toBe(false);
  });

  it('rejects a short BETTER_AUTH_SECRET', () => {
    expect(() => readEnv({ ...base, BETTER_AUTH_SECRET: 'short' })).toThrow();
  });

  it('rejects AUTH_DEV_MAGIC_LINK=true in production', () => {
    expect(() =>
      readEnv({ ...base, NODE_ENV: 'production', AUTH_DEV_MAGIC_LINK: 'true' }),
    ).toThrow(/production/);
  });

  it('coerces AUTH_DEV_MAGIC_LINK=true outside production', () => {
    expect(readEnv({ ...base, AUTH_DEV_MAGIC_LINK: 'true' }).AUTH_DEV_MAGIC_LINK).toBe(true);
  });
});
