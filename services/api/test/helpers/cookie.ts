export function cookieOf(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .filter((c): c is string => typeof c === 'string')
    .map((c) => c.split(';')[0] ?? '')
    .join('; ');
}
