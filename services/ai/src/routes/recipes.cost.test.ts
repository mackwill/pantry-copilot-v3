import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../env.js';
import { buildServer, type AppDeps } from '../server.js';

const env = {
  NODE_ENV: 'test',
  PORT: 4001,
  AI_SERVICE_TOKEN: '0123456789012345678901234567890123',
  DEFAULT_AI_PROVIDER: 'mock',
  DEFAULT_AI_MODEL: 'claude-sonnet-4-6',
  OPENAI_MODEL: 'gpt-4o',
  AI_PROVIDER_TIMEOUT_MS: 60_000,
} as unknown as Env;

function provider(): AppDeps['provider'] {
  return {
    name: 'mock',
    async *streamStructured() {
      await Promise.resolve();
      yield { type: 'thinking', seq: 0, t: 0 };
      yield { type: 'completed', seq: 1, t: 1, tokensUsed: { input: 120, output: 340 } };
    },
  } as unknown as AppDeps['provider'];
}

describe('recipe stream cost logging', () => {
  it('logs one ai.stream.cost line with token counts on completion', async () => {
    const app = await buildServer({ env, provider: provider() });
    const spy = vi.spyOn(app.log, 'info');
    const res = await app.inject({
      method: 'POST',
      url: '/recipes/generate/stream',
      headers: { authorization: `Bearer ${env.AI_SERVICE_TOKEN}` },
      payload: { prompt: 'soup', pantry: [], mustInclude: [], weirdness: 0 },
    });
    expect(res.statusCode).toBe(200);
    const costCall = spy.mock.calls.find(
      ([obj]) => (obj as { event?: string }).event === 'ai.stream.cost',
    );
    expect(costCall).toBeDefined();
    expect(costCall?.[0]).toMatchObject({
      provider: 'mock',
      tokensIn: 120,
      tokensOut: 340,
      outcome: 'completed',
    });
    await app.close();
  });
});
