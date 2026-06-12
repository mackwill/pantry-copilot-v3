import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import type { Db } from '../db/client.js';
import { accounts, sessions, users, verifications } from '../db/schema/index.js';
import { webOrigins, type Env } from '../env.js';
import type { MagicLinkOutbox } from './magic-link-outbox.js';

export function createAuth(opts: { env: Env; db: Db; outbox: MagicLinkOutbox }) {
  const { env, db, outbox } = opts;
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [...webOrigins(env), 'pantrycopilot://', 'exp://'],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { users, sessions, accounts, verifications },
    }),
    user: { modelName: 'users', fields: { image: 'avatarUrl' } },
    session: { modelName: 'sessions' },
    account: { modelName: 'accounts' },
    verification: { modelName: 'verifications' },
    advanced: { database: { generateId: false } },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
    },
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID !== undefined && env.GOOGLE_CLIENT_SECRET !== undefined
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
      ...(env.APPLE_CLIENT_ID !== undefined && env.APPLE_CLIENT_SECRET !== undefined
        ? {
            apple: {
              clientId: env.APPLE_CLIENT_ID,
              clientSecret: env.APPLE_CLIENT_SECRET,
            },
          }
        : {}),
    },
    plugins: [
      magicLink({
        sendMagicLink: ({ email, url }) => {
          outbox.record({ email, url });
        },
      }),
      expo(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
