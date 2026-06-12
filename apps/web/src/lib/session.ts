import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { z } from 'zod';

const sessionSchema = z
  .object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
    }),
  })
  .nullable();

export type SessionData = NonNullable<z.infer<typeof sessionSchema>>;

const apiUrl = (): string =>
  (typeof process !== 'undefined' ? process.env['VITE_API_URL'] : undefined) ??
  'http://localhost:4000';

async function parseSession(res: Response): Promise<SessionData | null> {
  if (!res.ok) return null;
  return sessionSchema.parse(await res.json());
}

const getSessionOnServer = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionData | null> => {
    const headers = getRequestHeaders();
    const cookie = headers.get('cookie');
    const res = await fetch(`${apiUrl()}/api/auth/get-session`, {
      headers: cookie === null ? {} : { cookie },
    });
    return parseSession(res);
  },
);

export async function getSession(): Promise<SessionData | null> {
  if (typeof window === 'undefined') return getSessionOnServer();
  const res = await fetch(`${apiUrl()}/api/auth/get-session`, { credentials: 'include' });
  return parseSession(res);
}
